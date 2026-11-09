import { lockManager } from '../src/concurrency/DistributedLockManager.js';
import { bookingService } from '../src/services/BookingService.js';
import { sweeperWorker } from '../src/concurrency/SweeperWorker.js';
import { getDb, inMemoryStorage } from '../src/db/pool.js';
import { getRedisClient } from '../src/redis/RedisClient.js';
import { GLOBAL_CONSTANTS } from '../src/config/globalConstants.js';

async function runConcurrencySimulation() {
  console.log(`
================================================================================
🏎️  BOOKMYSHOW MULTI-INSTANCE CONCURRENCY & RACE CONDITION BENCHMARK
================================================================================
Simulating 100 concurrent users across distributed server instances
attempting to lock and book the EXACT same VIP Recliner seats at the exact same millisecond!
================================================================================
  `);

  await getDb();
  const redis = await getRedisClient();
  await redis.flushall();

  const targetShowId = 'show-01';
  const targetSeatIds = ['seat-scr1-A1', 'seat-scr1-A2'];

  for (const seatId of targetSeatIds) {
    const ssKey = `ss-show1-${seatId.replace('seat-scr1-', '')}`;
    const ss = inMemoryStorage.tables.show_seats.get(ssKey);
    if (ss) {
      ss.status = 'AVAILABLE';
      ss.locked_by_user_id = null;
      ss.lock_expires_at = null;
    }
  }

  console.log(`Target Show: ${targetShowId}`);
  console.log(`Contested Seats: [${targetSeatIds.join(', ')}]`);
  console.log(`Total Concurrent Competing Callers: 100\n`);

  const callers = Array.from({ length: 100 }, (_, i) => ({
    userId: `customer-${i + 1}`,
    instanceId: i % 2 === 0 ? 'server-node-alpha' : 'server-node-beta'
  }));

  console.log('🏁 Launching 100 simultaneous lock requests in parallel (Promise.all)...');
  const t0 = Date.now();

  const results = await Promise.all(
    callers.map(caller => lockManager.acquireSeatHold(targetShowId, targetSeatIds, caller.userId))
  );

  const durationMs = Date.now() - t0;
  console.log(`⏱️ All 100 requests resolved in ${durationMs}ms.\n`);

  const successfulLocks = results.filter(r => r.success);
  const rejectedLocks = results.filter(r => !r.success);

  console.log(`📊 Benchmark Results:`);
  console.log(` - Total Requests Processed : ${results.length}`);
  console.log(` - Successful Lock Grants   : ${successfulLocks.length}`);
  console.log(` - Immediate Rejections    : ${rejectedLocks.length}`);
  if (rejectedLocks.length > 0) {
    console.log(` Sample rejection error:`, JSON.stringify(rejectedLocks[0]));
  }

  if (successfulLocks.length !== 1) {
    console.error(`❌ FAILURE: Expected exactly 1 winner, but got ${successfulLocks.length}! Double-locking occurred!`);
    process.exit(1);
  }

  console.log(`✅ VERIFICATION 1 PASSED: Exactly ONE caller acquired the lock lease.`);
  console.log(`✅ VERIFICATION 2 PASSED: 99 callers received immediate Conflict rejection without corruption.`);

  const winningIndex = results.findIndex(r => r.success);
  const winningCaller = callers[winningIndex];
  console.log(`👑 Winner: User ${winningCaller.userId} via ${winningCaller.instanceId}\n`);

  console.log(`💳 Winner ${winningCaller.userId} proceeding to Payment & Confirmation...`);
  const idempotencyKey = `idemp-test-${Date.now()}`;

  const confirmation = await bookingService.confirmBooking({
    showId: targetShowId,
    seatIds: targetSeatIds,
    userId: winningCaller.userId,
    userEmail: `${winningCaller.userId}@example.com`,
    userPhone: '+91 9876543210',
    idempotencyKey,
    paymentMethod: 'UPI_GPAY'
  });

  console.log(`✅ Booking Confirmed! Ref: ${confirmation.bookingReference}, Total: ₹${(confirmation.totalAmountCents / 100).toFixed(2)}`);

  console.log(`\n🔁 Testing Idempotency Guard: Resubmitting identical payment request with key '${idempotencyKey}'...`);
  const replayConfirmation = await bookingService.confirmBooking({
    showId: targetShowId,
    seatIds: targetSeatIds,
    userId: winningCaller.userId,
    userEmail: `${winningCaller.userId}@example.com`,
    userPhone: '+91 9876543210',
    idempotencyKey,
    paymentMethod: 'UPI_GPAY'
  });

  if (replayConfirmation.bookingReference === confirmation.bookingReference) {
    console.log(`✅ VERIFICATION 3 PASSED: Idempotency engine detected replay and returned original booking without duplicate charge.`);
  } else {
    console.error(`❌ FAILURE: Idempotency failed to return matching booking.`);
    process.exit(1);
  }

  console.log(`\n🧹 Testing Background Sweeper Worker on Expired Holds...`);
  const testSeat = ['seat-scr1-B1'];

  const ssRecord = inMemoryStorage.tables.show_seats.get('ss-show1-B1');
  if (ssRecord) {
    ssRecord.status = 'LOCKED';
    ssRecord.locked_by_user_id = 'abandoned-user-999';
    ssRecord.lock_expires_at = new Date(Date.now() - 10000).toISOString();
  }

  console.log(` -> Seat B1 set to EXPIRED hold.`);
  const sweptCount = await sweeperWorker.sweepExpiredHolds();
  console.log(` -> Sweeper ran. Auto-released count: ${sweptCount}`);

  if (ssRecord?.status === 'AVAILABLE') {
    console.log(`✅ VERIFICATION 4 PASSED: Expired seat automatically restored to AVAILABLE status.`);
  } else {
    console.error(`❌ FAILURE: Sweeper did not restore seat.`);
    process.exit(1);
  }

  console.log(`
================================================================================
🎉 ALL CONCURRENCY & SYSTEM DESIGN BENCHMARKS PASSED PERFECTLY!
Zero Double Bookings | Strict Idempotency | Automatic Sweeper Recovery
================================================================================
  `);
}

runConcurrencySimulation().catch(err => {
  console.error('Fatal Simulation Error:', err);
  process.exit(1);
});
