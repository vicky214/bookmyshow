import { getDb } from '../db/pool.js';
import { GLOBAL_CONSTANTS } from '../config/globalConstants.js';

export class SweeperWorker {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  start(): void {
    if (this.timer) return;

    console.log(`[SweeperWorker] [${GLOBAL_CONSTANTS.INSTANCE_ID}] Initialized with interval ${GLOBAL_CONSTANTS.BUSINESS.SWEEPER_INTERVAL_MS}ms.`);

    this.timer = setInterval(async () => {
      await this.sweepExpiredHolds();
    }, GLOBAL_CONSTANTS.BUSINESS.SWEEPER_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log(`[SweeperWorker] [${GLOBAL_CONSTANTS.INSTANCE_ID}] Stopped.`);
    }
  }

  async sweepExpiredHolds(): Promise<number> {
    if (this.isRunning) return 0;
    this.isRunning = true;

    try {
      const db = await getDb();
      const nowIso = new Date().toISOString();

      const [result] = await db.execute(
        `UPDATE show_seats
         SET status = 'AVAILABLE',
             locked_by_user_id = NULL,
             lock_expires_at = NULL,
             version = version + 1
         WHERE status = 'LOCKED' AND lock_expires_at IS NOT NULL AND lock_expires_at < ?`,
        [nowIso]
      );

      const affected = result?.affectedRows || 0;
      if (affected > 0) {
        console.log(`[SweeperWorker] [${GLOBAL_CONSTANTS.INSTANCE_ID}] Auto-released ${affected} expired seat holds back to AVAILABLE status.`);
      }

      return affected;
    } catch (err: any) {
      console.error(`[SweeperWorker Error] ${err.message}`);
      return 0;
    } finally {
      this.isRunning = false;
    }
  }
}

export const sweeperWorker = new SweeperWorker();
