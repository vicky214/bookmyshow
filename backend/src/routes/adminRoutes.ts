import { Router, Request, Response } from 'express';
import { adminService } from '../services/AdminService.js';
import { analyticsService } from '../services/AnalyticsService.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = Router();

router.use(adminAuth);

router.post('/cinemas', async (req: Request, res: Response) => {
  try {
    const { cityId, name, address, latitude, longitude, amenities } = req.body;
    if (!cityId || !name || !address || latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'Missing required cinema fields: cityId, name, address, latitude, longitude' });
      return;
    }

    const cinema = await adminService.addCinema({
      cityId,
      name,
      address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      amenities: amenities || ['Parking', 'M-Ticket']
    });

    res.status(201).json(cinema);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/screens', async (req: Request, res: Response) => {
  try {
    const { cinemaId, name, screenType, rowsConfig } = req.body;
    if (!cinemaId || !name || !rowsConfig || !Array.isArray(rowsConfig)) {
      res.status(400).json({ error: 'Missing required screen fields: cinemaId, name, rowsConfig (array)' });
      return;
    }

    const result = await adminService.addScreenWithSeats({
      cinemaId,
      name,
      screenType: screenType || 'DOLBY_ATMOS_4K',
      rowsConfig
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/shows', async (req: Request, res: Response) => {
  try {
    const { movieId, screenId, startTime, endTime, priceMultiplier } = req.body;
    if (!movieId || !screenId || !startTime || !endTime) {
      res.status(400).json({ error: 'Missing required show fields: movieId, screenId, startTime, endTime' });
      return;
    }

    const show = await adminService.scheduleShow({
      movieId,
      screenId,
      startTime,
      endTime,
      priceMultiplier: priceMultiplier ? parseFloat(priceMultiplier) : 1.0
    });

    res.status(201).json(show);
  } catch (err: any) {
    res.status(409).json({ error: err.message });
  }
});

router.get('/shows/:showId/occupancy', async (req: Request, res: Response) => {
  try {
    const occupancy = await adminService.getLiveShowOccupancy(req.params.showId);
    res.json(occupancy);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const analytics = await analyticsService.getDashboardAnalytics();
    res.json(analytics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
