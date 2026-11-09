import { getDb, inMemoryStorage } from '../db/pool.js';
import { GLOBAL_CONSTANTS } from '../config/globalConstants.js';

export class ShowService {
  async getCities(): Promise<any[]> {
    const db = await getDb();
    const [rows] = await db.query('SELECT * FROM cities ORDER BY name ASC');
    return rows;
  }

  async getMovies(): Promise<any[]> {
    const db = await getDb();
    const [rows] = await db.query('SELECT * FROM movies ORDER BY rating DESC');
    return rows;
  }

  async getCinemasByCity(cityId: string): Promise<any[]> {
    const db = await getDb();
    const [rows] = await db.query('SELECT * FROM cinemas WHERE city_id = ?', [cityId]);
    return rows.map((c: any) => ({
      ...c,
      amenities: typeof c.amenities === 'string' ? JSON.parse(c.amenities) : c.amenities
    }));
  }

  async getShows(movieId?: string, cinemaId?: string): Promise<any[]> {
    const db = await getDb();
    const [allShows] = await db.query('SELECT * FROM shows');
    const [allMovies] = await db.query('SELECT * FROM movies');
    const [allScreens] = await db.query('SELECT * FROM screens');
    const [allCinemas] = await db.query('SELECT * FROM cinemas');

    const movieMap = new Map<string, any>(allMovies.map((m: any) => [m.id, m]));
    const screenMap = new Map<string, any>(allScreens.map((s: any) => [s.id, s]));
    const cinemaMap = new Map<string, any>(allCinemas.map((c: any) => [c.id, c]));

    let filtered = allShows;
    if (movieId) filtered = filtered.filter((s: any) => s.movie_id === movieId);
    if (cinemaId) {
      filtered = filtered.filter((s: any) => {
        const screen = screenMap.get(s.screen_id);
        return screen && screen.cinema_id === cinemaId;
      });
    }

    return filtered.map((show: any) => {
      const movie: any = movieMap.get(show.movie_id) || {};
      const screen: any = screenMap.get(show.screen_id) || {};
      const cinema: any = cinemaMap.get(screen.cinema_id) || {};

      return {
        id: show.id,
        movieId: show.movie_id,
        movieTitle: movie.title,
        moviePoster: movie.poster_url,
        screenId: show.screen_id,
        screenName: screen.name,
        screenType: screen.screen_type,
        cinemaId: cinema.id,
        cinemaName: cinema.name,
        cinemaAddress: cinema.address,
        startTime: show.start_time,
        endTime: show.end_time,
        priceMultiplier: show.price_multiplier,
      };
    });
  }

  async getShowSeatMatrix(showId: string, currentUserId?: string): Promise<any> {
    const db = await getDb();

    const [shows] = await db.query('SELECT * FROM shows WHERE id = ?', [showId]);
    const show = shows[0];
    if (!show) throw new Error('Show not found');

    const [screens] = await db.query('SELECT * FROM screens WHERE id = ?', [show.screen_id]);
    const screen = screens[0];

    const [showSeats] = await db.query('SELECT * FROM show_seats WHERE show_id = ?', [showId]);
    const [seats] = await db.query('SELECT * FROM seats WHERE screen_id = ?', [show.screen_id]);

    const seatMetaMap = new Map<string, any>(seats.map((s: any) => [s.id, s]));
    const now = Date.now();

    const formattedSeats = showSeats.map((ss: any) => {
      const meta: any = seatMetaMap.get(ss.seat_id) || {};

      let effectiveStatus = ss.status;
      let remainingHoldSeconds = 0;

      if (ss.status === GLOBAL_CONSTANTS.SEAT_STATUS.LOCKED) {
        if (ss.lock_expires_at) {
          const expiresMs = new Date(ss.lock_expires_at).getTime();
          if (expiresMs > now) {
            remainingHoldSeconds = Math.max(0, Math.floor((expiresMs - now) / 1000));
          } else {
            effectiveStatus = GLOBAL_CONSTANTS.SEAT_STATUS.AVAILABLE;
          }
        }
      }

      const isLockedByMe = ss.status === GLOBAL_CONSTANTS.SEAT_STATUS.LOCKED && ss.locked_by_user_id === currentUserId;

      return {
        id: ss.id,
        seatId: ss.seat_id,
        rowLabel: meta.row_label || 'A',
        seatNumber: meta.seat_number || 1,
        seatType: meta.seat_type || 'CLASSIC',
        price: ss.price || meta.base_price || 18000,
        status: effectiveStatus,
        isLockedByMe,
        remainingHoldSeconds: isLockedByMe ? remainingHoldSeconds : 0
      };
    });

    const rowsMap = new Map<string, any[]>();
    for (const seat of formattedSeats) {
      if (!rowsMap.has(seat.rowLabel)) rowsMap.set(seat.rowLabel, []);
      rowsMap.get(seat.rowLabel)!.push(seat);
    }

    const sortedRows = Array.from(rowsMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([rowLabel, rowSeats]) => ({
        rowLabel,
        seats: rowSeats.sort((a, b) => a.seatNumber - b.seatNumber)
      }));

    return {
      showId,
      screenName: screen?.name || 'Screen 1',
      totalSeats: formattedSeats.length,
      availableSeats: formattedSeats.filter((s: any) => s.status === GLOBAL_CONSTANTS.SEAT_STATUS.AVAILABLE).length,
      rows: sortedRows
    };
  }
}

export const showService = new ShowService();
