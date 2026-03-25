import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { playerService } from '../services/playerService';

const router = Router();

router.get('/search', authenticate, async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const results = await playerService.searchPlayers(q, req.userId!, limit);
    return res.json({ success: true, data: { players: results } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Search failed' });
  }
});

router.get('/:id/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const profile = await playerService.getPublicProfile(req.params.id as string, req.userId!);
    return res.json({ success: true, data: profile });
  } catch (err: any) {
    if (err.message === 'User not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

export const playersRouter = router;
export default router;
