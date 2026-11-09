import { getDb } from '../db/pool.js';

export interface IdempotencyRecord {
  key: string;
  responseStatus: number;
  responseBody: any;
  createdAt: number;
}

export class IdempotencyEngine {
  private inMemoryCache = new Map<string, IdempotencyRecord>();

  async check(key: string): Promise<IdempotencyRecord | null> {
    if (!key) return null;

    const cached = this.inMemoryCache.get(key);
    if (cached) return cached;

    try {
      const db = await getDb();
      const [rows] = await db.query(
        `SELECT id, booking_reference, total_amount, status
         FROM bookings
         WHERE idempotency_key = ?
         LIMIT 1`,
        [key]
      );

      if (rows && rows.length > 0) {
        const booking = rows[0];
        const record: IdempotencyRecord = {
          key,
          responseStatus: 200,
          responseBody: {
            message: 'Idempotent replay: booking already confirmed.',
            booking
          },
          createdAt: Date.now()
        };
        this.inMemoryCache.set(key, record);
        return record;
      }
    } catch (err: any) {
      console.warn(`[Idempotency] DB check error: ${err.message}`);
    }

    return null;
  }

  save(key: string, status: number, body: any): void {
    if (!key) return;
    this.inMemoryCache.set(key, {
      key,
      responseStatus: status,
      responseBody: body,
      createdAt: Date.now()
    });
  }
}

export const idempotencyEngine = new IdempotencyEngine();
