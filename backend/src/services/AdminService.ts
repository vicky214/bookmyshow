import { getDb, inMemoryStorage } from '../db/pool.js';
import { GLOBAL_CONSTANTS } from '../config/globalConstants.js';

export class AdminService {

  async addCinema(data: {
    cityId: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    amenities: string[];
  }) {
    const db = await getDb();
    const cinemaId = `cin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const amenitiesJson = JSON.stringify(data.amenities || ['Parking', 'M-Ticket']);

    await db.execute(
      `INSERT INTO cinemas (id, city_id, name, address, latitude, longitude, amenities)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cinemaId, data.cityId, data.name, data.address, data.latitude, data.longitude, amenitiesJson]
    );

    inMemoryStorage.tables.cinemas.set(cinemaId, {
      id: cinemaId,
      city_id: data.cityId,
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      amenities: amenitiesJson,
      created_at: new Date()
    });

    console.log(`[AdminService] Added new cinema hall: ${data.name} (ID: ${cinemaId})`);
    return { id: cinemaId, ...data };
  }

  async addScreenWithSeats(data: {
    cinemaId: string;
    name: string;
    screenType: string;
    rowsConfig: Array<{ rowLabel: string; seatCount: number; tier: 'RECLINER' | 'PRIME' | 'CLASSIC' }>;
  }) {
    const db = await getDb();
    const screenId = `scr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const totalSeats = data.rowsConfig.reduce((sum, r) => sum + r.seatCount, 0);

    await db.execute(
      `INSERT INTO screens (id, cinema_id, name, screen_type, total_seats)
       VALUES (?, ?, ?, ?, ?)`,
      [screenId, data.cinemaId, data.name, data.screenType, totalSeats]
    );

    inMemoryStorage.tables.screens.set(screenId, {
      id: screenId,
      cinema_id: data.cinemaId,
      name: data.name,
      screen_type: data.screenType,
      total_seats: totalSeats
    });

    const generatedSeats: any[] = [];
    for (const r of data.rowsConfig) {
      const basePrice = GLOBAL_CONSTANTS.SEAT_TIERS[r.tier]?.basePriceCents || 18000;

      for (let num = 1; num <= r.seatCount; num++) {
        const seatId = `seat-${screenId}-${r.rowLabel}${num}`;
        await db.execute(
          `INSERT INTO seats (id, screen_id, row_label, seat_number, seat_type, base_price)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [seatId, screenId, r.rowLabel, num, r.tier, basePrice]
        );

        const seatRecord = {
          id: seatId,
          screen_id: screenId,
          row_label: r.rowLabel,
          seat_number: num,
          seat_type: r.tier,
          base_price: basePrice
        };
        inMemoryStorage.tables.seats.set(seatId, seatRecord);
        generatedSeats.push(seatRecord);
      }
    }

    console.log(`[AdminService] Created screen ${data.name} with ${totalSeats} seats across ${data.rowsConfig.length} rows.`);
    return { screenId, totalSeats, seatCount: generatedSeats.length };
  }

  async scheduleShow(data: {
    movieId: string;
    screenId: string;
    startTime: string;
    endTime: string;
    priceMultiplier?: number;
  }) {
    const db = await getDb();
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (start >= end) {
      throw new Error('Show start time must be before end time.');
    }

    const [existingShows] = await db.query(
      `SELECT id, start_time, end_time
       FROM shows
       WHERE screen_id = ? AND NOT (end_time <= ? OR start_time >= ?)`,
      [data.screenId, start.toISOString(), end.toISOString()]
    );

    if (existingShows && existingShows.length > 0) {
      throw new Error(`Schedule conflict detected! Screen ${data.screenId} already has an active show during this timeframe.`);
    }

    const showId = `show-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const multiplier = data.priceMultiplier || 1.0;

    await db.execute(
      `INSERT INTO shows (id, movie_id, screen_id, start_time, end_time, price_multiplier)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [showId, data.movieId, data.screenId, start.toISOString(), end.toISOString(), multiplier]
    );

    inMemoryStorage.tables.shows.set(showId, {
      id: showId,
      movie_id: data.movieId,
      screen_id: data.screenId,
      start_time: start,
      end_time: end,
      price_multiplier: multiplier,
      created_at: new Date()
    });

    const [seats] = await db.query('SELECT * FROM seats WHERE screen_id = ?', [data.screenId]);
    for (const seat of seats) {
      const showSeatId = `ss-${showId}-${seat.row_label}${seat.seat_number}`;
      const finalPrice = Math.round(seat.base_price * multiplier);

      await db.execute(
        `INSERT INTO show_seats (id, show_id, seat_id, status, price, version)
         VALUES (?, ?, ?, 'AVAILABLE', ?, 1)`,
        [showSeatId, showId, seat.id, finalPrice]
      );

      inMemoryStorage.tables.show_seats.set(showSeatId, {
        id: showSeatId,
        show_id: showId,
        seat_id: seat.id,
        status: GLOBAL_CONSTANTS.SEAT_STATUS.AVAILABLE,
        locked_by_user_id: null,
        lock_expires_at: null,
        price: finalPrice,
        version: 1,
        updated_at: new Date()
      });
    }

    console.log(`[AdminService] Scheduled show ${showId} with ${seats.length} initialized seats.`);
    return { showId, seatCount: seats.length, startTime: data.startTime, endTime: data.endTime };
  }

  async getLiveShowOccupancy(showId: string) {
    const db = await getDb();
    const [showSeats] = await db.query('SELECT status, count(*) as count FROM show_seats WHERE show_id = ? GROUP BY status', [showId]);

    const counts: Record<string, number> = {
      AVAILABLE: 0,
      LOCKED: 0,
      BOOKED: 0,
      BLOCKED: 0
    };

    for (const row of showSeats) {
      counts[row.status] = Number(row.count);
    }

    const total = counts.AVAILABLE + counts.LOCKED + counts.BOOKED + counts.BLOCKED;
    const occupancyRate = total > 0 ? Number(((counts.BOOKED / total) * 100).toFixed(1)) : 0;

    return {
      showId,
      totalSeats: total,
      counts,
      occupancyPercentage: occupancyRate
    };
  }
}

export const adminService = new AdminService();
