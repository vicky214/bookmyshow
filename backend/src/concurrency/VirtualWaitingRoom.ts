import crypto from 'crypto';
import { getRedisClient, IRedisAdapter } from '../redis/RedisClient.js';
import { GLOBAL_CONSTANTS } from '../config/globalConstants.js';

export interface QueueStatus {
  showId: string;
  userId: string;
  inQueue: boolean;
  rank: number;
  totalInQueue: number;
  estimatedWaitSeconds: number;
  admitted: boolean;
  admissionToken?: string;
  expiresAt?: string;
}

export class VirtualWaitingRoom {
  private secretKey: string;

  private static ADMISSION_BATCH_SIZE = 50;
  private static PASS_TTL_SECONDS = 600;

  constructor() {
    this.secretKey = GLOBAL_CONSTANTS.SECURITY.JWT_SECRET || 'bms_waiting_room_secret';
  }

  private getQueueKey(showId: string): string {
    return `waiting_room:${showId}`;
  }

  private getAdmissionKey(showId: string, userId: string): string {
    return `pass:${showId}:${userId}`;
  }

  private generateToken(showId: string, userId: string, expiresAt: number): string {
    const payload = `${showId}:${userId}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', this.secretKey).update(payload).digest('hex');
    return `PASS.${Buffer.from(payload).toString('base64url')}.${signature}`;
  }

  public verifyToken(token: string, showId: string, userId: string): boolean {
    try {
      if (!token || !token.startsWith('PASS.')) return false;
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf8');
      const signature = parts[2];

      const expectedSignature = crypto.createHmac('sha256', this.secretKey).update(payloadStr).digest('hex');
      if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature)) === false) {
        return false;
      }

      const [tokenShowId, tokenUserId, expStr] = payloadStr.split(':');
      const expiresAt = parseInt(expStr, 10);

      if (tokenShowId !== showId || tokenUserId !== userId) return false;
      if (Date.now() > expiresAt) return false;

      return true;
    } catch {
      return false;
    }
  }

  async joinQueue(showId: string, userId: string): Promise<QueueStatus> {
    const redis: IRedisAdapter = await getRedisClient();
    const queueKey = this.getQueueKey(showId);
    const admissionKey = this.getAdmissionKey(showId, userId);

    const activePass = await redis.get(admissionKey);
    if (activePass) {
      return {
        showId,
        userId,
        inQueue: false,
        rank: 0,
        totalInQueue: await redis.zcard(queueKey),
        estimatedWaitSeconds: 0,
        admitted: true,
        admissionToken: activePass
      };
    }

    const now = Date.now();
    await redis.zadd(queueKey, now, userId);

    return await this.getStatus(showId, userId);
  }

  async getStatus(showId: string, userId: string): Promise<QueueStatus> {
    const redis = await getRedisClient();
    const queueKey = this.getQueueKey(showId);
    const admissionKey = this.getAdmissionKey(showId, userId);

    const activePass = await redis.get(admissionKey);
    const totalInQueue = await redis.zcard(queueKey);

    if (activePass) {
      return {
        showId,
        userId,
        inQueue: false,
        rank: 0,
        totalInQueue,
        estimatedWaitSeconds: 0,
        admitted: true,
        admissionToken: activePass
      };
    }

    const rank0 = await redis.zrank(queueKey, userId);
    if (rank0 === null) {
      return {
        showId,
        userId,
        inQueue: false,
        rank: -1,
        totalInQueue,
        estimatedWaitSeconds: 0,
        admitted: false
      };
    }

    const rank = rank0 + 1;

    const batchIntervalSec = 5;
    const estimatedWaitSeconds = Math.ceil((rank / VirtualWaitingRoom.ADMISSION_BATCH_SIZE) * batchIntervalSec);

    return {
      showId,
      userId,
      inQueue: true,
      rank,
      totalInQueue,
      estimatedWaitSeconds,
      admitted: false
    };
  }

  async admitNextBatch(showId: string, count: number = VirtualWaitingRoom.ADMISSION_BATCH_SIZE): Promise<string[]> {
    const redis = await getRedisClient();
    const queueKey = this.getQueueKey(showId);

    const candidates = await redis.zrange(queueKey, 0, count - 1);
    if (candidates.length === 0) return [];

    const expiresAt = Date.now() + (VirtualWaitingRoom.PASS_TTL_SECONDS * 1000);
    const admittedUserIds: string[] = [];

    for (const userId of candidates) {
      const token = this.generateToken(showId, userId, expiresAt);
      const admissionKey = this.getAdmissionKey(showId, userId);

      await redis.set(admissionKey, token, 'EX', VirtualWaitingRoom.PASS_TTL_SECONDS);
      await redis.zrem(queueKey, userId);
      admittedUserIds.push(userId);
    }

    return admittedUserIds;
  }

  async leaveQueue(showId: string, userId: string): Promise<boolean> {
    const redis = await getRedisClient();
    const queueKey = this.getQueueKey(showId);
    const removed = await redis.zrem(queueKey, userId);
    return removed > 0;
  }
}

export const virtualWaitingRoom = new VirtualWaitingRoom();
