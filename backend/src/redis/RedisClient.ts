import { Redis } from 'ioredis';
import { GLOBAL_CONSTANTS } from '../config/globalConstants.js';

export interface IRedisAdapter {
  isLiveCluster(): boolean;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null>;
  del(...keys: string[]): Promise<number>;
  eval(script: string, numkeys: number, ...args: (string | number)[]): Promise<any>;
  zadd(key: string, score: number, member: string): Promise<number>;
  zrank(key: string, member: string): Promise<number | null>;
  zcard(key: string): Promise<number>;
  zrange(key: string, start: number, stop: number): Promise<string[]>;
  zrem(key: string, ...members: string[]): Promise<number>;
  pexpire(key: string, milliseconds: number): Promise<number>;
  flushall(): Promise<'OK'>;
}

class InMemoryRedisAdapter implements IRedisAdapter {
  private kv = new Map<string, { value: string; expiresAt?: number }>();

  private zsets = new Map<string, Map<string, number>>();

  isLiveCluster(): boolean {
    return false;
  }

  private cleanExpired(key: string): boolean {
    const item = this.kv.get(key);
    if (!item) return false;
    if (item.expiresAt && item.expiresAt <= Date.now()) {
      this.kv.delete(key);
      return false;
    }
    return true;
  }

  async get(key: string): Promise<string | null> {
    if (!this.cleanExpired(key)) return null;
    return this.kv.get(key)?.value ?? null;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null> {
    let expiresAt: number | undefined;
    if (mode === 'PX' && duration) {
      expiresAt = Date.now() + duration;
    } else if (mode === 'EX' && duration) {
      expiresAt = Date.now() + duration * 1000;
    }
    this.kv.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const k of keys) {
      if (this.kv.delete(k)) count++;
      if (this.zsets.delete(k)) count++;
    }
    return count;
  }

  async pexpire(key: string, milliseconds: number): Promise<number> {
    const item = this.kv.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + milliseconds;
    return 1;
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    let zset = this.zsets.get(key);
    if (!zset) {
      zset = new Map<string, number>();
      this.zsets.set(key, zset);
    }
    const isNew = !zset.has(member);
    zset.set(member, score);
    return isNew ? 1 : 0;
  }

  async zrank(key: string, member: string): Promise<number | null> {
    const zset = this.zsets.get(key);
    if (!zset || !zset.has(member)) return null;

    const sorted = [...zset.entries()].sort((a, b) => a[1] - b[1]);
    const index = sorted.findIndex(([m]) => m === member);
    return index >= 0 ? index : null;
  }

  async zcard(key: string): Promise<number> {
    const zset = this.zsets.get(key);
    return zset ? zset.size : 0;
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    const zset = this.zsets.get(key);
    if (!zset) return [];
    const sorted = [...zset.entries()].sort((a, b) => a[1] - b[1]).map(([m]) => m);
    const end = stop === -1 ? sorted.length : stop + 1;
    return sorted.slice(start, end);
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    const zset = this.zsets.get(key);
    if (!zset) return 0;
    let count = 0;
    for (const m of members) {
      if (zset.delete(m)) count++;
    }
    return count;
  }

  async flushall(): Promise<'OK'> {
    this.kv.clear();
    this.zsets.clear();
    return 'OK';
  }

  async eval(script: string, numkeys: number, ...args: (string | number)[]): Promise<any> {
    const keys = args.slice(0, numkeys).map(k => String(k));
    const argv = args.slice(numkeys).map(a => String(a));

    if (script.includes('ACQUIRE_MULTI_SEAT_LOCK') || script.includes('MULTI_LOCK')) {
      const userId = argv[0];
      const ttlMs = parseInt(argv[1], 10);

      for (const key of keys) {
        if (this.cleanExpired(key)) {
          return [0, key];
        }
      }

      const expiresAt = Date.now() + ttlMs;
      for (const key of keys) {
        this.kv.set(key, { value: userId, expiresAt });
      }

      return [1, 'OK'];
    }

    if (script.includes('RELEASE_MULTI_SEAT_LOCK') || script.includes('MULTI_RELEASE')) {
      const userId = argv[0];
      let releasedCount = 0;

      for (const key of keys) {
        const item = this.kv.get(key);
        if (item && item.value === userId) {
          this.kv.delete(key);
          releasedCount++;
        }
      }

      return releasedCount;
    }

    if (script.includes('ADMIT_QUEUE_BATCH')) {
      const queueKey = keys[0];
      const batchSize = parseInt(argv[0], 10);
      const tokenTtlMs = parseInt(argv[1], 10);

      const zset = this.zsets.get(queueKey);
      if (!zset || zset.size === 0) return [];

      const sorted = [...zset.entries()].sort((a, b) => a[1] - b[1]);
      const admitted = sorted.slice(0, batchSize);

      for (const [member] of admitted) {
        zset.delete(member);

        const admissionKey = `pass:${member}`;
        this.kv.set(admissionKey, { value: 'ADMITTED', expiresAt: Date.now() + tokenTtlMs });
      }

      return admitted.map(([m]) => m);
    }

    throw new Error(`Unsupported Lua script passed to InMemoryRedisAdapter: ${script.substring(0, 40)}...`);
  }
}

class LiveRedisAdapter implements IRedisAdapter {
  constructor(private client: Redis) {}

  isLiveCluster(): boolean {
    return true;
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null> {
    if (mode === 'PX' && duration) {
      return (await (this.client as any).set(key, value, 'PX', duration)) as 'OK';
    }
    if (mode === 'EX' && duration) {
      return (await (this.client as any).set(key, value, 'EX', duration)) as 'OK';
    }
    return (await this.client.set(key, value)) as 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    return await this.client.del(...keys);
  }

  async pexpire(key: string, milliseconds: number): Promise<number> {
    return await this.client.pexpire(key, milliseconds);
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    return await (this.client as any).zadd(key, score, member);
  }

  async zrank(key: string, member: string): Promise<number | null> {
    return await this.client.zrank(key, member);
  }

  async zcard(key: string): Promise<number> {
    return await this.client.zcard(key);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return await (this.client as any).zrange(key, start, stop);
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    return await this.client.zrem(key, ...members);
  }

  async flushall(): Promise<'OK'> {
    return (await this.client.flushall()) as 'OK';
  }

  async eval(script: string, numkeys: number, ...args: (string | number)[]): Promise<any> {
    return await (this.client as any).eval(script, numkeys, ...args);
  }
}

let redisAdapterInstance: IRedisAdapter | null = null;
let redisInitPromise: Promise<IRedisAdapter> | null = null;

export async function getRedisClient(): Promise<IRedisAdapter> {
  if (redisAdapterInstance) return redisAdapterInstance;
  if (redisInitPromise) return await redisInitPromise;

  redisInitPromise = (async () => {
    try {
      const liveClient = new Redis({
        host: GLOBAL_CONSTANTS.REDIS.HOST,
        port: GLOBAL_CONSTANTS.REDIS.PORT,
        password: GLOBAL_CONSTANTS.REDIS.PASSWORD,
        connectTimeout: 800,
        maxRetriesPerRequest: 0,
        retryStrategy: () => null, // Do not hang if redis is not running
        lazyConnect: true,
      });

      liveClient.on('error', () => {
        // Suppress connection failure events during discovery/fallback
      });

      await Promise.race([
        liveClient.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), 800))
      ]);

      await liveClient.ping();
      console.log(`[Redis] Connected to live Redis Server at ${GLOBAL_CONSTANTS.REDIS.HOST}:${GLOBAL_CONSTANTS.REDIS.PORT}`);
      redisAdapterInstance = new LiveRedisAdapter(liveClient);
      return redisAdapterInstance;
    } catch (err: any) {
      console.warn(`[Redis] Live Redis connection unavailable (${err.message}). Activating In-Memory Atomic Redis Adapter.`);
      redisAdapterInstance = new InMemoryRedisAdapter();
      return redisAdapterInstance;
    }
  })();

  return await redisInitPromise;
}

export const inMemoryRedis = new InMemoryRedisAdapter();
