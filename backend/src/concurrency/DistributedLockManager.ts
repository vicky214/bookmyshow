import { getDb, DatabaseConnection } from '../db/pool.js';
import { GLOBAL_CONSTANTS } from '../config/globalConstants.js';
import { getRedisClient, IRedisAdapter } from '../redis/RedisClient.js';
import { virtualWaitingRoom } from './VirtualWaitingRoom.js';

export interface LockResult {
  success: boolean;
  lockedSeats: string[];
  failedSeats: string[];
  expiresAt?: string;
  error?: string;
}

export class DistributedLockManager {

  private static ACQUIRE_LOCK_LUA = `
    -- ACQUIRE_MULTI_SEAT_LOCK
    local userId = ARGV[1]
    local ttlMs = tonumber(ARGV[2])

    for i = 1, #KEYS do
      if redis.call('EXISTS', KEYS[i]) == 1 then
        return {0, KEYS[i]}
      end
    end

    for i = 1, #KEYS do
      redis.call('SET', KEYS[i], userId, 'PX', ttlMs)
    end

    return {1, 'OK'}
  `;

  private static RELEASE_LOCK_LUA = `
    -- RELEASE_MULTI_SEAT_LOCK
    local userId = ARGV[1]
    local releasedCount = 0

    for i = 1, #KEYS do
      if redis.call('GET', KEYS[i]) == userId then
        redis.call('DEL', KEYS[i])
        releasedCount = releasedCount + 1
      end
    end

    return releasedCount
  `;

  async acquireSeatHold(
    showId: string,
    seatIds: string[],
    userId: string,
    admissionToken?: string
  ): Promise<LockResult> {
    if (seatIds.length === 0) {
      return { success: false, lockedSeats: [], failedSeats: [], error: 'No seats provided' };
    }
    if (seatIds.length > GLOBAL_CONSTANTS.BUSINESS.MAX_SEATS_PER_BOOKING) {
      return {
        success: false,
        lockedSeats: [],
        failedSeats: [],
        error: `Cannot lock more than ${GLOBAL_CONSTANTS.BUSINESS.MAX_SEATS_PER_BOOKING} seats per transaction.`
      };
    }

    if (admissionToken && !virtualWaitingRoom.verifyToken(admissionToken, showId, userId)) {
      return {
        success: false,
        lockedSeats: [],
        failedSeats: seatIds,
        error: 'Invalid or expired Waiting Room admission pass. Please rejoin the queue.'
      };
    }

    const redis: IRedisAdapter = await getRedisClient();
    const lockTtlMs = GLOBAL_CONSTANTS.BUSINESS.SEAT_LOCK_TTL_SECONDS * 1000;
    const now = Date.now();
    const expiresAtIso = new Date(now + lockTtlMs).toISOString();

    const leaseKeys = seatIds.map(seatId => `lease:${showId}:${seatId}`);

    const redisResult = await redis.eval(
      DistributedLockManager.ACQUIRE_LOCK_LUA,
      leaseKeys.length,
      ...leaseKeys,
      userId,
      lockTtlMs
    );

    const [acquired, contestedKey] = Array.isArray(redisResult) ? redisResult : [1, 'OK'];

    if (acquired !== 1) {
      const contestedSeat = contestedKey ? contestedKey.replace(`lease:${showId}:`, '') : 'requested seat';
      return {
        success: false,
        lockedSeats: [],
        failedSeats: [contestedSeat],
        error: `Seat ${contestedSeat} is currently held by another customer. Fast-rejected at Redis cache tier.`
      };
    }

    const db = await getDb();
    const conn: DatabaseConnection = await db.getConnection();

    try {
      await conn.beginTransaction();

      const [rows] = await conn.query(
        `SELECT id, seat_id, status, locked_by_user_id, lock_expires_at, version
         FROM show_seats
         WHERE show_id = ? AND seat_id IN (${seatIds.map(() => '?').join(',')})
         FOR UPDATE`,
        [showId, ...seatIds]
      );

      const seatMap = new Map<string, any>();
      for (const row of rows) {
        seatMap.set(row.seat_id, row);
      }

      const failedSeats: string[] = [];
      const successfullyLocked: string[] = [];

      for (const seatId of seatIds) {
        const seatRecord = seatMap.get(seatId);

        if (!seatRecord) {
          failedSeats.push(seatId);
          continue;
        }

        if (seatRecord.status === GLOBAL_CONSTANTS.SEAT_STATUS.BOOKED) {
          failedSeats.push(seatId);
          continue;
        }

        const isLocked = seatRecord.status === GLOBAL_CONSTANTS.SEAT_STATUS.LOCKED;
        const lockNotExpired = seatRecord.lock_expires_at && new Date(seatRecord.lock_expires_at).getTime() > now;
        const isDifferentUser = seatRecord.locked_by_user_id !== userId;

        if (isLocked && lockNotExpired && isDifferentUser) {
          failedSeats.push(seatId);
          continue;
        }

        successfullyLocked.push(seatId);
      }

      if (failedSeats.length > 0) {
        await conn.rollback();
        await redis.eval(DistributedLockManager.RELEASE_LOCK_LUA, leaseKeys.length, ...leaseKeys, userId);
        return {
          success: false,
          lockedSeats: [],
          failedSeats,
          error: `Seats [${failedSeats.join(', ')}] could not be reserved in relational store.`
        };
      }

      await conn.execute(
        `UPDATE show_seats
         SET status = 'LOCKED',
             locked_by_user_id = ?,
             lock_expires_at = ?,
             version = version + 1
         WHERE show_id = ? AND seat_id IN (${seatIds.map(() => '?').join(',')})`,
        [userId, expiresAtIso, showId, ...seatIds]
      );

      await conn.commit();

      console.log(`[LockManager] [${GLOBAL_CONSTANTS.INSTANCE_ID}] Successfully locked seats [${seatIds.join(', ')}] for user ${userId} until ${expiresAtIso}`);

      return {
        success: true,
        lockedSeats: successfullyLocked,
        failedSeats: [],
        expiresAt: expiresAtIso
      };
    } catch (err: any) {
      await conn.rollback();

      await redis.eval(DistributedLockManager.RELEASE_LOCK_LUA, leaseKeys.length, ...leaseKeys, userId);
      console.error(`[LockManager] Lock acquisition DB failed: ${err.message}`);
      return {
        success: false,
        lockedSeats: [],
        failedSeats: seatIds,
        error: `Database concurrency exception: ${err.message}`
      };
    } finally {
      conn.release();
    }
  }

  async releaseSeatHold(showId: string, seatIds: string[], userId: string): Promise<boolean> {
    const redis = await getRedisClient();
    const leaseKeys = seatIds.map(seatId => `lease:${showId}:${seatId}`);

    await redis.eval(DistributedLockManager.RELEASE_LOCK_LUA, leaseKeys.length, ...leaseKeys, userId);

    const db = await getDb();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      await conn.execute(
        `UPDATE show_seats
         SET status = 'AVAILABLE',
             locked_by_user_id = NULL,
             lock_expires_at = NULL
         WHERE show_id = ? AND locked_by_user_id = ? AND seat_id IN (${seatIds.map(() => '?').join(',')})`,
        [showId, userId, ...seatIds]
      );

      await conn.commit();
      console.log(`[LockManager] Released hold for seats [${seatIds.join(', ')}] by user ${userId}`);
      return true;
    } catch (err: any) {
      await conn.rollback();
      console.error(`[LockManager] Release hold error: ${err.message}`);
      return false;
    } finally {
      conn.release();
    }
  }
}

export const lockManager = new DistributedLockManager();
