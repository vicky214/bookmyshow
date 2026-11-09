import { getDb } from '../db/pool.js';
import { lockManager } from '../concurrency/DistributedLockManager.js';
import { idempotencyEngine } from '../concurrency/IdempotencyEngine.js';
import { GLOBAL_CONSTANTS } from '../config/globalConstants.js';

export interface BookingRequest {
  showId: string;
  seatIds: string[];
  userId: string;
  userEmail: string;
  userPhone: string;
  idempotencyKey: string;
  paymentMethod?: string;
}

export class BookingService {

  async lockSeats(showId: string, seatIds: string[], userId: string, admissionToken?: string) {
    return await lockManager.acquireSeatHold(showId, seatIds, userId, admissionToken);
  }

  async releaseSeats(showId: string, seatIds: string[], userId: string) {
    return await lockManager.releaseSeatHold(showId, seatIds, userId);
  }

  async confirmBooking(req: BookingRequest) {

    const existing = await idempotencyEngine.check(req.idempotencyKey);
    if (existing) {
      console.log(`[BookingService] Returning cached response for idempotency key: ${req.idempotencyKey}`);
      return existing.responseBody;
    }

    const db = await getDb();
    const conn = await db.getConnection();
    const now = Date.now();

    try {
      await conn.beginTransaction();

      const [showSeats] = await conn.query(
        `SELECT id, seat_id, status, locked_by_user_id, lock_expires_at, price
         FROM show_seats
         WHERE show_id = ? AND seat_id IN (${req.seatIds.map(() => '?').join(',')})
         FOR UPDATE`,
        [req.showId, ...req.seatIds]
      );

      if (showSeats.length !== req.seatIds.length) {
        throw new Error('One or more selected seats were not found.');
      }

      for (const seat of showSeats) {
        if (seat.status === GLOBAL_CONSTANTS.SEAT_STATUS.BOOKED) {
          throw new Error(`Seat ${seat.seat_id} is already permanently booked.`);
        }

        const isLockedByMe = seat.status === GLOBAL_CONSTANTS.SEAT_STATUS.LOCKED && seat.locked_by_user_id === req.userId;
        const lockValid = seat.lock_expires_at && new Date(seat.lock_expires_at).getTime() > now;

        if (!isLockedByMe || !lockValid) {
          throw new Error(`Your 10-minute hold on seat ${seat.seat_id} has expired or was lost. Please reselect your seats.`);
        }
      }

      const subtotalCents = showSeats.reduce((sum: number, s: any) => sum + s.price, 0);
      const convenienceFeeCents = Math.round(subtotalCents * GLOBAL_CONSTANTS.BUSINESS.CONVENIENCE_FEE_RATE) + GLOBAL_CONSTANTS.BUSINESS.BASE_CONVENIENCE_FEE_CENTS;
      const totalAmountCents = subtotalCents + convenienceFeeCents;

      const bookingId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const randomRef = Math.floor(10000 + Math.random() * 90000);
      const bookingRef = `BMS-MUM-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${randomRef}`;

      await conn.execute(
        `UPDATE show_seats
         SET status = 'BOOKED',
             locked_by_user_id = ?,
             lock_expires_at = NULL,
             version = version + 1
         WHERE show_id = ? AND seat_id IN (${req.seatIds.map(() => '?').join(',')})`,
        [req.userId, req.showId, ...req.seatIds]
      );

      await conn.execute(
        `INSERT INTO bookings
         (id, booking_reference, user_id, show_id, total_amount, convenience_fee, status, idempotency_key)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [bookingId, bookingRef, req.userId, req.showId, totalAmountCents, convenienceFeeCents, 'CONFIRMED', req.idempotencyKey]
      );

      for (const seat of showSeats) {
        const bsId = `bs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await conn.execute(
          `INSERT INTO booking_seats (id, booking_id, show_seat_id, price) VALUES (?, ?, ?, ?)`,
          [bsId, bookingId, seat.seat_id, seat.price]
        );
      }

      const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const txRef = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      await conn.execute(
        `INSERT INTO payments
         (id, booking_id, transaction_ref, gateway, amount, status, paid_at)
         VALUES (?, ?, ?, ?, ?, 'SUCCESS', ?)`,
        [paymentId, bookingId, txRef, req.paymentMethod || 'INTERNAL_MOCK', totalAmountCents, new Date().toISOString()]
      );

      await conn.commit();

      const responsePayload = {
        success: true,
        bookingId,
        bookingReference: bookingRef,
        transactionRef: txRef,
        totalAmountCents,
        convenienceFeeCents,
        seatCount: req.seatIds.length,
        bookedSeatIds: req.seatIds,
        userEmail: req.userEmail,
        confirmedAt: new Date().toISOString(),
        qrPayload: `BMS|${bookingRef}|${req.showId}|${req.seatIds.join(',')}|${totalAmountCents}`
      };

      idempotencyEngine.save(req.idempotencyKey, 200, responsePayload);

      console.log(`[BookingService] Successfully confirmed booking ${bookingRef} ($${(totalAmountCents / 100).toFixed(2)}) for user ${req.userId}`);
      return responsePayload;
    } catch (err: any) {
      await conn.rollback();
      console.error(`[BookingService Confirmation Error] ${err.message}`);
      throw err;
    } finally {
      conn.release();
    }
  }

  async getBookingByReference(ref: string) {
    const db = await getDb();
    const [rows] = await db.query('SELECT * FROM bookings WHERE booking_reference = ?', [ref]);
    return rows[0] || null;
  }

  async getUserBookings(userId: string) {
    const db = await getDb();
    const [rawBookings] = await db.query('SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    const bookings = [...rawBookings].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const [movies] = await db.query('SELECT * FROM movies');
    const [shows] = await db.query('SELECT * FROM shows');
    const [cinemas] = await db.query('SELECT * FROM cinemas');
    const [screens] = await db.query('SELECT * FROM screens');
    const [seats] = await db.query('SELECT * FROM seats');

    const movieMap = new Map<string, any>(movies.map((m: any) => [m.id, m]));
    const showMap = new Map<string, any>(shows.map((s: any) => [s.id, s]));
    const cinemaMap = new Map<string, any>(cinemas.map((c: any) => [c.id, c]));
    const screenMap = new Map<string, any>(screens.map((sc: any) => [sc.id, sc]));
    const seatMap = new Map<string, any>(seats.map((st: any) => [st.id, st]));

    return bookings.map((b: any) => {
      const show = showMap.get(b.show_id) || ({} as any);
      const movie = movieMap.get(show.movie_id) || ({} as any);
      const screen = screenMap.get(show.screen_id) || ({} as any);
      const cinema = cinemaMap.get(screen.cinema_id) || ({} as any);

      const seatIds: string[] = b.seat_ids || [];
      const resolvedSeats = seatIds.map((sId: string) => {
        const found = seatMap.get(sId);
        return found ? `${found.row_label}${found.seat_number}` : sId.replace('seat-scr1-', '');
      });

      return {
        id: b.id,
        bookingReference: b.booking_reference,
        status: b.status,
        totalAmountCents: b.total_amount,
        convenienceFeeCents: b.convenience_fee,
        createdAt: b.created_at,
        movie: {
          id: movie.id,
          title: movie.title || 'Movie Title',
          posterUrl: movie.poster_url,
          durationMins: movie.duration_mins,
          genre: movie.genre,
          rating: movie.rating
        },
        cinema: {
          id: cinema.id,
          name: cinema.name || 'PVR Multiplex',
          address: cinema.address || 'Auditorium'
        },
        screen: {
          id: screen.id,
          name: screen.name || 'Audi 1',
          screenType: screen.screen_type || 'DOLBY_ATMOS_4K'
        },
        show: {
          id: show.id,
          startTime: show.start_time,
          endTime: show.end_time
        },
        seats: resolvedSeats,
        seatIds,
        qrPayload: `BMS|${b.booking_reference}|${b.show_id}|${seatIds.join(',')}|${b.total_amount}`
      };
    });
  }

  async cancelBooking(bookingId: string, userId: string) {
    const db = await getDb();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const [rows] = await conn.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
      if (rows.length === 0) {
        throw new Error('Booking not found.');
      }
      const booking = rows[0];

      if (booking.user_id !== userId) {
        throw new Error('Unauthorized to cancel this booking.');
      }

      if (booking.status !== 'CONFIRMED') {
        throw new Error(`Cannot cancel booking with status: ${booking.status}`);
      }

      await conn.execute('UPDATE bookings SET status = \'CANCELLED\' WHERE id = ?', [bookingId]);

      const seatIds: string[] = booking.seat_ids || [];
      if (seatIds.length > 0) {
        await conn.execute(
          `UPDATE show_seats
           SET status = 'AVAILABLE',
               locked_by_user_id = NULL,
               lock_expires_at = NULL,
               version = version + 1
           WHERE show_id = ? AND seat_id IN (${seatIds.map(() => '?').join(',')})`,
          [booking.show_id, ...seatIds]
        );

        await lockManager.releaseSeatHold(booking.show_id, seatIds, userId);
      }

      await conn.commit();
      console.log(`[BookingService] Successfully cancelled booking ${booking.booking_reference} for user ${userId}`);

      return {
        success: true,
        bookingId,
        bookingReference: booking.booking_reference,
        status: 'CANCELLED',
        message: 'Booking successfully cancelled and refund initiated.'
      };
    } catch (err: any) {
      await conn.rollback();
      console.error(`[BookingService Cancel Error] ${err.message}`);
      throw err;
    } finally {
      conn.release();
    }
  }
}

export const bookingService = new BookingService();
