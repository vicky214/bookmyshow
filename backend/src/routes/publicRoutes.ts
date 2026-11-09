import { Router, Request, Response } from 'express';
import { showService } from '../services/ShowService.js';
import { bookingService } from '../services/BookingService.js';
import { virtualWaitingRoom } from '../concurrency/VirtualWaitingRoom.js';

const router = Router();

router.get('/cities', async (req: Request, res: Response) => {
  try {
    const cities = await showService.getCities();
    res.json(cities);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/movies', async (req: Request, res: Response) => {
  try {
    const movies = await showService.getMovies();
    res.json(movies);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cinemas', async (req: Request, res: Response) => {
  try {
    const cityId = req.query.cityId as string;
    const cinemas = await showService.getCinemasByCity(cityId);
    res.json(cinemas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/shows', async (req: Request, res: Response) => {
  try {
    const movieId = req.query.movieId as string;
    const cinemaId = req.query.cinemaId as string;
    const shows = await showService.getShows(movieId, cinemaId);
    res.json(shows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/shows/:showId/seats', async (req: Request, res: Response) => {
  try {
    const showId = req.params.showId;
    const userId = (req.query.userId as string) || req.headers['x-user-id'] as string;
    const seatMatrix = await showService.getShowSeatMatrix(showId, userId);
    res.json(seatMatrix);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.post('/waiting-room/join', async (req: Request, res: Response) => {
  try {
    const { showId, userId } = req.body;
    if (!showId || !userId) {
      res.status(400).json({ error: 'Missing showId or userId' });
      return;
    }
    const status = await virtualWaitingRoom.joinQueue(showId, userId);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/waiting-room/status', async (req: Request, res: Response) => {
  try {
    const showId = req.query.showId as string;
    const userId = req.query.userId as string;
    if (!showId || !userId) {
      res.status(400).json({ error: 'Missing showId or userId' });
      return;
    }
    const status = await virtualWaitingRoom.getStatus(showId, userId);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/waiting-room/admit', async (req: Request, res: Response) => {
  try {
    const { showId, count } = req.body;
    if (!showId) {
      res.status(400).json({ error: 'Missing showId' });
      return;
    }
    const admittedUsers = await virtualWaitingRoom.admitNextBatch(showId, count ? parseInt(count, 10) : undefined);
    res.json({ success: true, count: admittedUsers.length, admittedUsers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bookings/lock', async (req: Request, res: Response) => {
  try {
    const { showId, seatIds, userId, admissionToken } = req.body;
    const pass = admissionToken || (req.headers['x-admission-pass'] as string);

    if (!showId || !seatIds || !Array.isArray(seatIds) || !userId) {
      res.status(400).json({ error: 'Missing required parameters: showId, seatIds (array), userId' });
      return;
    }

    const result = await bookingService.lockSeats(showId, seatIds, userId, pass);
    if (!result.success) {
      res.status(409).json(result);
      return;
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bookings/release', async (req: Request, res: Response) => {
  try {
    const { showId, seatIds, userId } = req.body;
    const success = await bookingService.releaseSeats(showId, seatIds, userId);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bookings/confirm', async (req: Request, res: Response) => {
  try {
    const { showId, seatIds, userId, userEmail, userPhone, idempotencyKey, paymentMethod } = req.body;
    if (!showId || !seatIds || !userId || !idempotencyKey) {
      res.status(400).json({ error: 'Missing required booking confirmation fields.' });
      return;
    }

    const confirmation = await bookingService.confirmBooking({
      showId,
      seatIds,
      userId,
      userEmail: userEmail || `${userId}@example.com`,
      userPhone: userPhone || '+91 9876543210',
      idempotencyKey,
      paymentMethod
    });

    res.json(confirmation);
  } catch (err: any) {
    res.status(409).json({ error: err.message });
  }
});

router.get('/bookings/:reference', async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.getBookingByReference(req.params.reference);
    if (!booking) {
      res.status(404).json({ error: 'Booking reference not found.' });
      return;
    }
    res.json(booking);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users/:userId/bookings', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const bookings = await bookingService.getUserBookings(userId);
    res.json(bookings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bookings/:bookingId/cancel', async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.bookingId;
    const userId = req.body.userId || (req.headers['x-user-id'] as string);
    if (!userId) {
      res.status(400).json({ error: 'Missing userId in request body or headers.' });
      return;
    }
    const result = await bookingService.cancelBooking(bookingId, userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
