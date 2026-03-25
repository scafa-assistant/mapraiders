// ============================================================
// Friend Routes
// REST API endpoints for the MapRaiders friend system:
//   friendships, friend requests, blocking
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { friendService } from '../services/friendService';

const router = Router();

// GET /api/friends — List all friends
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const friends = await friendService.getFriends(req.userId!);
    return res.json({ success: true, data: { friends } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to get friends' });
  }
});

// POST /api/friends/request — Send a friend request
router.post('/request', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
    const result = await friendService.sendRequest(req.userId!, userId);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    if (err.message?.includes('Cannot') || err.message?.includes('Already')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to send request' });
  }
});

// GET /api/friends/requests — Get pending incoming requests
router.get('/requests', authenticate, async (req: Request, res: Response) => {
  try {
    const requests = await friendService.getPendingRequests(req.userId!);
    return res.json({ success: true, data: { requests } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to get requests' });
  }
});

// GET /api/friends/requests/sent — Get pending outgoing requests
router.get('/requests/sent', authenticate, async (req: Request, res: Response) => {
  try {
    const requests = await friendService.getSentRequests(req.userId!);
    return res.json({ success: true, data: { requests } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to get sent requests' });
  }
});

// PUT /api/friends/requests/:id/accept — Accept a friend request
router.put('/requests/:id/accept', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await friendService.acceptRequest(req.params.id as string, req.userId!);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    if (err.message?.includes('not found') || err.message?.includes('Not your')) {
      return res.status(404).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to accept request' });
  }
});

// PUT /api/friends/requests/:id/decline — Decline a friend request
router.put('/requests/:id/decline', authenticate, async (req: Request, res: Response) => {
  try {
    await friendService.declineRequest(req.params.id as string, req.userId!);
    return res.json({ success: true, data: { declined: true } });
  } catch (err: any) {
    return res.status(404).json({ success: false, message: err.message || 'Request not found' });
  }
});

// DELETE /api/friends/:userId — Remove a friend
router.delete('/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    await friendService.removeFriend(req.userId!, req.params.userId as string);
    return res.json({ success: true, data: { removed: true } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to remove friend' });
  }
});

// POST /api/friends/block — Block a user
router.post('/block', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
    await friendService.blockUser(req.userId!, userId);
    return res.json({ success: true, data: { blocked: true } });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message || 'Failed to block user' });
  }
});

// DELETE /api/friends/block/:userId — Unblock a user
router.delete('/block/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    await friendService.unblockUser(req.userId!, req.params.userId as string);
    return res.json({ success: true, data: { unblocked: true } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to unblock user' });
  }
});

// GET /api/friends/blocked — Get list of blocked users
router.get('/blocked', authenticate, async (req: Request, res: Response) => {
  try {
    const blocked = await friendService.getBlockedUsers(req.userId!);
    return res.json({ success: true, data: { blocked } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to get blocked users' });
  }
});

export const friendsRouter = router;
export default router;
