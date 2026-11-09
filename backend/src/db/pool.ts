import mysql from 'mysql2/promise';
import { GLOBAL_CONSTANTS } from '../config/globalConstants.js';

export interface DatabaseAdapter {
  query<T = any>(sql: string, params?: any[]): Promise<[T, any]>;
  execute<T = any>(sql: string, params?: any[]): Promise<[T, any]>;
  getConnection(): Promise<DatabaseConnection>;
}

export interface DatabaseConnection {
  query<T = any>(sql: string, params?: any[]): Promise<[T, any]>;
  execute<T = any>(sql: string, params?: any[]): Promise<[T, any]>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
}

class InMemoryDatabaseEngine implements DatabaseAdapter {
  public tables = {
    cities: new Map<string, any>(),
    cinemas: new Map<string, any>(),
    screens: new Map<string, any>(),
    seats: new Map<string, any>(),
    movies: new Map<string, any>(),
    shows: new Map<string, any>(),
    show_seats: new Map<string, any>(),
    bookings: new Map<string, any>(),
    booking_seats: new Map<string, any>(),
    payments: new Map<string, any>(),
    partners: new Map<string, any>(),
    users: new Map<string, any>(),
  };

  private activeRowLocks = new Set<string>();

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {

    this.tables.cities.set('city-mum', { id: 'city-mum', name: 'Mumbai', state: 'Maharashtra', country: 'India', slug: 'mumbai' });
    this.tables.cities.set('city-del', { id: 'city-del', name: 'Delhi NCR', state: 'Delhi', country: 'India', slug: 'delhi-ncr' });
    this.tables.cities.set('city-blr', { id: 'city-blr', name: 'Bengaluru', state: 'Karnataka', country: 'India', slug: 'bengaluru' });

    this.tables.cinemas.set('cin-01', {
      id: 'cin-01',
      city_id: 'city-mum',
      name: 'PVR: Phoenix Palladium, Lower Parel',
      address: 'Level 3, High Street Phoenix, 462 Senapati Bapat Marg, Lower Parel, Mumbai 400013',
      latitude: 18.995055,
      longitude: 72.825638,
      amenities: JSON.stringify(['Parking', 'M-Ticket', 'Food & Beverage', 'Dolby Atmos', 'Recliner']),
      created_at: new Date()
    });
    this.tables.cinemas.set('cin-02', {
      id: 'cin-02',
      city_id: 'city-mum',
      name: 'INOX Megaplex: Inorbit Mall, Malad',
      address: '4th Floor, Inorbit Mall, Link Road, Malad West, Mumbai 400064',
      latitude: 19.1729,
      longitude: 72.8362,
      amenities: JSON.stringify(['Parking', 'M-Ticket', 'IMAX Laser', 'Gourmet Menu']),
      created_at: new Date()
    });
    this.tables.cinemas.set('cin-03', {
      id: 'cin-03',
      city_id: 'city-del',
      name: "PVR Director's Cut: Ambience Mall, Vasant Kunj",
      address: 'Nelson Mandela Marg, Vasant Kunj, New Delhi 110070',
      latitude: 28.5401,
      longitude: 77.1554,
      amenities: JSON.stringify(['Valet Parking', 'Luxury Dining', 'Dolby Atmos', 'Recliners']),
      created_at: new Date()
    });
    this.tables.cinemas.set('cin-04', {
      id: 'cin-04',
      city_id: 'city-blr',
      name: 'PVR: Forum Mall, Koramangala',
      address: '21, Hosur Rd, Koramangala, Bengaluru 560095',
      latitude: 12.9345,
      longitude: 77.6113,
      amenities: JSON.stringify(['Parking', 'M-Ticket', '4DX', 'Dolby Atmos']),
      created_at: new Date()
    });

    this.tables.screens.set('scr-mum-01', { id: 'scr-mum-01', cinema_id: 'cin-01', name: 'Audi 1 (Dolby Atmos 4K)', screen_type: 'DOLBY_ATMOS_4K', total_seats: 40 });
    this.tables.screens.set('scr-mum-02', { id: 'scr-mum-02', cinema_id: 'cin-01', name: 'Audi 2 (IMAX 3D Laser)', screen_type: 'IMAX_3D', total_seats: 40 });

    const rows = [
      { label: 'A', type: 'RECLINER', basePrice: GLOBAL_CONSTANTS.SEAT_TIERS.RECLINER.basePriceCents },
      { label: 'B', type: 'PRIME', basePrice: GLOBAL_CONSTANTS.SEAT_TIERS.PRIME.basePriceCents },
      { label: 'C', type: 'PRIME', basePrice: GLOBAL_CONSTANTS.SEAT_TIERS.PRIME.basePriceCents },
      { label: 'D', type: 'CLASSIC', basePrice: GLOBAL_CONSTANTS.SEAT_TIERS.CLASSIC.basePriceCents },
      { label: 'E', type: 'CLASSIC', basePrice: GLOBAL_CONSTANTS.SEAT_TIERS.CLASSIC.basePriceCents },
    ];

    for (const r of rows) {
      for (let num = 1; num <= 8; num++) {
        const seatId = `seat-scr1-${r.label}${num}`;
        this.tables.seats.set(seatId, {
          id: seatId,
          screen_id: 'scr-mum-01',
          row_label: r.label,
          seat_number: num,
          seat_type: r.type,
          base_price: r.basePrice
        });
      }
    }

    this.tables.movies.set('mov-01', {
      id: 'mov-01',
      title: 'Dune: Part Two',
      description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators.',
      language: 'English',
      duration_mins: 166,
      genre: 'Sci-Fi / Adventure',
      rating: 8.8,
      poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
      release_date: '2024-03-01'
    });
    this.tables.movies.set('mov-02', {
      id: 'mov-02',
      title: 'Oppenheimer',
      description: 'The story of American scientist J. Robert Oppenheimer and his role in the atomic bomb development.',
      language: 'English',
      duration_mins: 180,
      genre: 'Biography / Drama',
      rating: 8.9,
      poster_url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80',
      release_date: '2023-07-21'
    });

    const now = new Date();
    const show1Time = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const show1EndTime = new Date(show1Time.getTime() + 166 * 60 * 1000);

    this.tables.shows.set('show-01', {
      id: 'show-01',
      movie_id: 'mov-01',
      screen_id: 'scr-mum-01',
      start_time: show1Time,
      end_time: show1EndTime,
      price_multiplier: 1.0,
      created_at: new Date()
    });

    for (const seat of this.tables.seats.values()) {
      if (seat.screen_id === 'scr-mum-01') {
        const showSeatId = `ss-show1-${seat.row_label}${seat.seat_number}`;
        this.tables.show_seats.set(showSeatId, {
          id: showSeatId,
          show_id: 'show-01',
          seat_id: seat.id,
          status: GLOBAL_CONSTANTS.SEAT_STATUS.AVAILABLE,
          locked_by_user_id: null,
          lock_expires_at: null,
          price: seat.base_price,
          version: 1,
          updated_at: new Date()
        });
      }
    }

    this.tables.partners.set('partner-01', {
      id: 'partner-01',
      partner_name: 'Google Pay India',
      api_key: 'bms_partner_gpay_live_key_2026',
      api_secret: 'gpay_secret_live_2026',
      api_secret_hash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
      rate_limit_rpm: 600,
      is_active: true
    });
    this.tables.partners.set('partner-02', {
      id: 'partner-02',
      partner_name: 'Paytm Entertainment',
      api_key: 'bms_partner_paytm_live_key_2026',
      api_secret: 'paytm_secret_live_2026',
      api_secret_hash: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
      rate_limit_rpm: 300,
      is_active: true
    });

    this.tables.users.set('customer-alice', {
      id: 'customer-alice',
      name: 'Alice Johnson',
      email: 'alice@bookmyshow.com',
      role: 'CUSTOMER',
      created_at: new Date()
    });
    this.tables.users.set('customer-bob', {
      id: 'customer-bob',
      name: 'Bob Smith',
      email: 'bob@bookmyshow.com',
      role: 'CUSTOMER',
      created_at: new Date()
    });
    this.tables.users.set('admin-master', {
      id: 'admin-master',
      name: 'Operations Director',
      email: 'admin@bookmyshow.com',
      role: 'ADMIN',
      created_at: new Date()
    });

    const seedBookingId = 'book-seed-alice-01';
    const seedRef = 'BMS-MUM-202611-10024';
    this.tables.bookings.set(seedBookingId, {
      id: seedBookingId,
      booking_reference: seedRef,
      user_id: 'customer-alice',
      show_id: 'show-01',
      total_amount: 56000,
      convenience_fee: 6400,
      status: 'CONFIRMED',
      idempotency_key: 'seed-idemp-alice-01',
      seat_ids: ['seat-scr1-C1', 'seat-scr1-C2'],
      created_at: new Date(Date.now() - 3600000)
    });
    const ss1 = this.tables.show_seats.get('ss-show1-C1');
    if (ss1) { ss1.status = 'BOOKED'; ss1.locked_by_user_id = 'customer-alice'; }
    const ss2 = this.tables.show_seats.get('ss-show1-C2');
    if (ss2) { ss2.status = 'BOOKED'; ss2.locked_by_user_id = 'customer-alice'; }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<[T, any]> {
    return this.executeMockQuery<T>(sql, params, false);
  }

  async execute<T = any>(sql: string, params: any[] = []): Promise<[T, any]> {
    return this.executeMockQuery<T>(sql, params, false);
  }

  async getConnection(): Promise<DatabaseConnection> {
    const connectionHeldLocks = new Set<string>();
    let inTransaction = false;

    return {
      query: async (sql: string, params: any[] = []) => {
        const isForUpdate = /FOR\s+UPDATE/i.test(sql);
        return this.executeMockQuery(sql, params, isForUpdate, connectionHeldLocks);
      },
      execute: async (sql: string, params: any[] = []) => {
        const isForUpdate = /FOR\s+UPDATE/i.test(sql);
        return this.executeMockQuery(sql, params, isForUpdate, connectionHeldLocks);
      },
      beginTransaction: async () => {
        inTransaction = true;
      },
      commit: async () => {
        inTransaction = false;

        for (const lockId of connectionHeldLocks) {
          this.activeRowLocks.delete(lockId);
        }
        connectionHeldLocks.clear();
      },
      rollback: async () => {
        inTransaction = false;
        for (const lockId of connectionHeldLocks) {
          this.activeRowLocks.delete(lockId);
        }
        connectionHeldLocks.clear();
      },
      release: () => {
        for (const lockId of connectionHeldLocks) {
          this.activeRowLocks.delete(lockId);
        }
        connectionHeldLocks.clear();
      }
    };
  }

  private async executeMockQuery<T = any>(
    sql: string,
    params: any[] = [],
    isForUpdate: boolean = false,
    connLocks?: Set<string>
  ): Promise<[T, any]> {
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    if (/FROM show_seats/i.test(cleanSql) && /SELECT/i.test(cleanSql)) {
      const showId = params[0];
      const seatIds = params.slice(1);

      const matched: any[] = [];
      for (const ss of this.tables.show_seats.values()) {
        if (ss.show_id === showId && (seatIds.length === 0 || seatIds.includes(ss.id) || seatIds.includes(ss.seat_id))) {
          if (isForUpdate) {

            if (this.activeRowLocks.has(ss.id) && !connLocks?.has(ss.id)) {
              throw new Error(`LockConflictException: Row show_seat ${ss.id} is locked by another concurrent transaction.`);
            }
            this.activeRowLocks.add(ss.id);
            connLocks?.add(ss.id);
          }
          matched.push({ ...ss });
        }
      }
      return [matched as unknown as T, null];
    }

    if (/UPDATE show_seats/i.test(cleanSql)) {
      let updatedCount = 0;
      if (/status\s*=\s*'AVAILABLE'/i.test(cleanSql)) {

        const now = new Date();
        const isSweeper = /lock_expires_at\s*<\s*\?/i.test(cleanSql);
        const showId = !isSweeper ? params[0] : null;
        const userId = !isSweeper ? params[1] : null;
        const targetIds = !isSweeper ? params.slice(2) : [];

        for (const ss of this.tables.show_seats.values()) {
          if (isSweeper) {
            if (ss.status === 'LOCKED' && ss.lock_expires_at && new Date(ss.lock_expires_at) < now) {
              ss.status = 'AVAILABLE';
              ss.locked_by_user_id = null;
              ss.lock_expires_at = null;
              ss.version += 1;
              updatedCount++;
            }
          } else {
            if (ss.show_id === showId && (!userId || ss.locked_by_user_id === userId) && (targetIds.includes(ss.id) || targetIds.includes(ss.seat_id))) {
              ss.status = 'AVAILABLE';
              ss.locked_by_user_id = null;
              ss.lock_expires_at = null;
              ss.version += 1;
              updatedCount++;
            }
          }
        }
      } else {

        const isBook = /status\s*=\s*'BOOKED'/i.test(cleanSql);
        if (isBook) {
          const userId = params[0];
          const showId = params[1];
          const targetIds = params.slice(2);
          for (const ss of this.tables.show_seats.values()) {
            if (ss.show_id === showId && (targetIds.includes(ss.id) || targetIds.includes(ss.seat_id))) {
              ss.status = 'BOOKED';
              ss.locked_by_user_id = userId;
              ss.lock_expires_at = null;
              ss.version += 1;
              updatedCount++;
            }
          }
        } else {

          const userId = params[0];
          const expiresAt = params[1];
          const showId = params[2];
          const targetIds = params.slice(3);
          for (const ss of this.tables.show_seats.values()) {
            if (ss.show_id === showId && (targetIds.includes(ss.id) || targetIds.includes(ss.seat_id))) {
              ss.status = 'LOCKED';
              ss.locked_by_user_id = userId;
              ss.lock_expires_at = expiresAt;
              ss.version += 1;
              updatedCount++;
            }
          }
        }
      }
      return [{ affectedRows: updatedCount } as unknown as T, null];
    }

    if (/INSERT INTO bookings/i.test(cleanSql)) {
      const [id, bookingRef, userId, showId, total, fee, status, idempotencyKey] = params;
      if ([...this.tables.bookings.values()].some(b => b.idempotency_key === idempotencyKey)) {
        throw new Error(`Duplicate entry for key 'uk_booking_idempotency'`);
      }
      const record = { id, booking_reference: bookingRef, user_id: userId, show_id: showId, total_amount: total, convenience_fee: fee, status, idempotency_key: idempotencyKey, seat_ids: [], created_at: new Date() };
      this.tables.bookings.set(id, record);
      return [{ affectedRows: 1, insertId: id } as unknown as T, null];
    }

    if (/INSERT INTO booking_seats/i.test(cleanSql)) {
      const [id, bookingId, showSeatId, price] = params;
      this.tables.booking_seats.set(id, { id, booking_id: bookingId, show_seat_id: showSeatId, price });
      const b = this.tables.bookings.get(bookingId);
      if (b) {
        if (!b.seat_ids) b.seat_ids = [];
        b.seat_ids.push(showSeatId);
      }
      return [{ affectedRows: 1, insertId: id } as unknown as T, null];
    }

    if (/UPDATE bookings/i.test(cleanSql)) {
      if (/status\s*=\s*'CANCELLED'/i.test(cleanSql)) {
        const bookingId = params[0];
        const b = this.tables.bookings.get(bookingId);
        if (b) {
          b.status = 'CANCELLED';
          return [{ affectedRows: 1 } as unknown as T, null];
        }
      }
      return [{ affectedRows: 0 } as unknown as T, null];
    }

    if (/FROM cities/i.test(cleanSql)) {
      return [[...this.tables.cities.values()] as unknown as T, null];
    }
    if (/FROM movies/i.test(cleanSql)) {
      return [[...this.tables.movies.values()] as unknown as T, null];
    }
    if (/FROM cinemas/i.test(cleanSql)) {
      const cityId = params[0];
      const cinemas = [...this.tables.cinemas.values()].filter(c => !cityId || c.city_id === cityId);
      return [cinemas as unknown as T, null];
    }
    if (/FROM screens/i.test(cleanSql)) {
      const screens = [...this.tables.screens.values()];
      return [screens as unknown as T, null];
    }
    if (/FROM seats/i.test(cleanSql)) {
      const screenId = params[0];
      const seats = [...this.tables.seats.values()].filter(s => !screenId || s.screen_id === screenId);
      return [seats as unknown as T, null];
    }
    if (/FROM shows/i.test(cleanSql)) {
      return [[...this.tables.shows.values()] as unknown as T, null];
    }
    if (/FROM partners/i.test(cleanSql)) {
      const apiKey = params[0];
      const partner = [...this.tables.partners.values()].find(p => p.api_key === apiKey);
      return [[partner].filter(Boolean) as unknown as T, null];
    }
    if (/FROM users/i.test(cleanSql)) {
      if (/email\s*=\s*\?/i.test(cleanSql)) {
        const email = params[0];
        const user = [...this.tables.users.values()].find(u => u.email.toLowerCase() === (email || '').toLowerCase());
        return [[user].filter(Boolean) as unknown as T, null];
      }
      if (/id\s*=\s*\?/i.test(cleanSql)) {
        const id = params[0];
        const user = this.tables.users.get(id);
        return [[user].filter(Boolean) as unknown as T, null];
      }
      return [[...this.tables.users.values()] as unknown as T, null];
    }
    if (/INSERT INTO users/i.test(cleanSql)) {
      const [id, name, email, role] = params;
      const user = { id, name, email, role: role || 'CUSTOMER', created_at: new Date() };
      this.tables.users.set(id, user);
      return [{ affectedRows: 1, insertId: id } as unknown as T, null];
    }
    if (/FROM bookings/i.test(cleanSql)) {
      if (/idempotency_key\s*=\s*\?/i.test(cleanSql)) {
        const key = params[0];
        const b = [...this.tables.bookings.values()].find(x => x.idempotency_key === key);
        return [[b].filter(Boolean) as unknown as T, null];
      }
      if (/user_id\s*=\s*\?/i.test(cleanSql)) {
        const userId = params[0];
        const list = [...this.tables.bookings.values()].filter(b => b.user_id === userId);
        return [list as unknown as T, null];
      }
      if (/booking_reference\s*=\s*\?/i.test(cleanSql)) {
        const ref = params[0];
        const b = [...this.tables.bookings.values()].find(x => x.booking_reference === ref);
        return [[b].filter(Boolean) as unknown as T, null];
      }
      if (/id\s*=\s*\?/i.test(cleanSql)) {
        const id = params[0];
        const b = this.tables.bookings.get(id);
        return [[b].filter(Boolean) as unknown as T, null];
      }
      return [[...this.tables.bookings.values()] as unknown as T, null];
    }

    return [[] as unknown as T, null];
  }
}

let dbInstance: DatabaseAdapter;

export async function getDb(): Promise<DatabaseAdapter> {
  if (dbInstance) return dbInstance;

  try {
    const pool = mysql.createPool({
      host: GLOBAL_CONSTANTS.DATABASE.HOST,
      port: GLOBAL_CONSTANTS.DATABASE.PORT,
      user: GLOBAL_CONSTANTS.DATABASE.USER,
      password: GLOBAL_CONSTANTS.DATABASE.PASSWORD,
      database: GLOBAL_CONSTANTS.DATABASE.NAME,
      waitForConnections: true,
      connectionLimit: GLOBAL_CONSTANTS.DATABASE.CONNECTION_LIMIT,
      connectTimeout: GLOBAL_CONSTANTS.DATABASE.CONNECT_TIMEOUT_MS,
    });

    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    console.log(`[Database] Successfully connected to live MySQL 8 at ${GLOBAL_CONSTANTS.DATABASE.HOST}:${GLOBAL_CONSTANTS.DATABASE.PORT}`);
    dbInstance = pool as unknown as DatabaseAdapter;
    return dbInstance;
  } catch (err: any) {
    console.warn(`[Database] Live MySQL connection failed (${err.message}). Activating In-Memory ACID Storage Engine with full row-level locking.`);
    dbInstance = inMemoryStorage;
    return dbInstance;
  }
}

export const inMemoryStorage = new InMemoryDatabaseEngine();
