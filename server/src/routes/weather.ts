// ============================================================
// Weather Routes
// GET /api/weather - Get current weather + bonus for a location
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { weatherService } from '../services/weatherService';

const router = Router();

/**
 * GET /api/weather
 * Get current weather conditions and XP bonus multiplier for a GPS location.
 * Query params: lat, lng
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'lat and lng query parameters are required',
      });
    }

    const weather = await weatherService.getWeather(lat, lng);

    // Build a human-readable description from the condition
    const descriptions: Record<string, string> = {
      clear: 'Clear skies',
      light_rain: 'Light rain',
      heavy_rain: 'Heavy rain',
      snow: 'Snowing',
      storm: 'Thunderstorm',
      cold: 'Extreme cold',
      heat: 'Extreme heat',
    };

    const description = descriptions[weather.condition ?? 'clear'] || 'Clear skies';

    return res.json({
      success: true,
      data: {
        condition: weather.condition,
        temperature: weather.temperature,
        description,
        bonus: weather.bonus,
      },
    });
  } catch (err: any) {
    console.error('[Weather] Get weather error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get weather data' });
  }
});

export const weatherRouter = router;
export default router;
