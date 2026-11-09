import { Router, Response } from 'express';
import { partnerAuth, AuthenticatedPartnerRequest } from '../middleware/partnerAuth.js';
import { distributedRateLimiter } from '../middleware/distributedRateLimiter.js';
import { showService } from '../services/ShowService.js';
import { bookingService } from '../services/BookingService.js';

const router = Router();

router.use(partnerAuth);
router.use(distributedRateLimiter());

router.get('/partner-profile', (req: AuthenticatedPartnerRequest, res: Response) => {
  res.json({
    status: 'ACTIVE',
    authenticatedPartner: req.partner,
    serverInstance: process.env.INSTANCE_ID || 'bms-node-primary',
    timestamp: new Date().toISOString()
  });
});

router.get('/movies', async (req: AuthenticatedPartnerRequest, res: Response) => {
  try {
    const movies = await showService.getMovies();
    res.json({
      partner: req.partner?.name,
      count: movies.length,
      data: movies
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/shows', async (req: AuthenticatedPartnerRequest, res: Response) => {
  try {
    const movieId = req.query.movieId as string;
    const cinemaId = req.query.cinemaId as string;
    const shows = await showService.getShows(movieId, cinemaId);
    res.json({
      partner: req.partner?.name,
      count: shows.length,
      data: shows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/shows/:showId/availability', async (req: AuthenticatedPartnerRequest, res: Response) => {
  try {
    const seatMatrix = await showService.getShowSeatMatrix(req.params.showId);
    res.json({
      partner: req.partner?.name,
      showId: req.params.showId,
      totalSeats: seatMatrix.totalSeats,
      availableSeats: seatMatrix.availableSeats,
      rows: seatMatrix.rows
    });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.post('/bookings/lock', async (req: AuthenticatedPartnerRequest, res: Response) => {
  try {
    const { showId, seatIds, partnerUserId } = req.body;
    if (!showId || !seatIds || !Array.isArray(seatIds) || !partnerUserId) {
      res.status(400).json({ error: 'Missing required fields: showId, seatIds (array), partnerUserId' });
      return;
    }

    const scopedUserId = `partner:${req.partner?.id}:${partnerUserId}`;
    const result = await bookingService.lockSeats(showId, seatIds, scopedUserId);

    if (!result.success) {
      res.status(409).json(result);
      return;
    }

    res.json({
      partner: req.partner?.name,
      ...result
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bookings/confirm', async (req: AuthenticatedPartnerRequest, res: Response) => {
  try {
    const { showId, seatIds, partnerUserId, partnerTxRef, partnerUserEmail } = req.body;
    if (!showId || !seatIds || !partnerUserId || !partnerTxRef) {
      res.status(400).json({ error: 'Missing required confirmation fields: showId, seatIds, partnerUserId, partnerTxRef' });
      return;
    }

    const scopedUserId = `partner:${req.partner?.id}:${partnerUserId}`;
    const idempotencyKey = `idemp:${req.partner?.id}:${partnerTxRef}`;

    const confirmation = await bookingService.confirmBooking({
      showId,
      seatIds,
      userId: scopedUserId,
      userEmail: partnerUserEmail || `partner-user-${partnerUserId}@partner.com`,
      userPhone: '+91 9999999999',
      idempotencyKey,
      paymentMethod: `PARTNER_${req.partner?.name?.toUpperCase().replace(/\\s+/g, '_')}`
    });

    res.json({
      partner: req.partner?.name,
      partnerTxRef,
      ...confirmation
    });
  } catch (err: any) {
    res.status(409).json({ error: err.message });
  }
});

export default router;
