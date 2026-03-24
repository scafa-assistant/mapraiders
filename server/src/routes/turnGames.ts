// ============================================================
// Turn-Based Game Routes
// POST   /api/games                  - Start a game (challenge territory)
// GET    /api/games/my               - Get my active games
// GET    /api/games/:id              - Get game state
// POST   /api/games/:id/move         - Make a move
// GET    /api/games/:id/moves        - Get move history
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { turnGameEngine } from '../services/turnGameEngine';

const router = Router();

/**
 * POST /api/games
 * Start a new turn-based game (challenger initiates).
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { territoryId, gameType, defenseId } = req.body;

    if (!territoryId) {
      return res.status(400).json({ success: false, message: 'territoryId is required' });
    }
    if (!gameType || !['tic_tac_toe', 'mini_chess'].includes(gameType)) {
      return res.status(400).json({ success: false, message: 'Invalid game type' });
    }

    // Get territory owner (defender)
    const { queryOne } = await import('../config/database');
    const territory = await queryOne<{ owner_id: string }>(
      'SELECT owner_id FROM territories WHERE id = $1',
      [territoryId]
    );
    if (!territory) {
      return res.status(404).json({ success: false, message: 'Territory not found' });
    }
    if (territory.owner_id === req.userId!) {
      return res.status(400).json({ success: false, message: 'Cannot challenge your own territory' });
    }

    const game = await turnGameEngine.createGame(
      territoryId as string,
      territory.owner_id,
      req.userId!,
      gameType,
      defenseId
    );

    return res.status(201).json({ success: true, data: game });
  } catch (err: any) {
    console.error('[TurnGames] Create error:', err);
    if (err.message?.includes('already active')) {
      return res.status(409).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: err.message || 'Failed to create game' });
  }
});

/**
 * GET /api/games/my
 * Get all active games for the current user.
 */
router.get('/my', authenticate, async (req: Request, res: Response) => {
  try {
    const games = await turnGameEngine.getMyGames(req.userId!);
    return res.json({ success: true, data: { games } });
  } catch (err: any) {
    console.error('[TurnGames] My games error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get games' });
  }
});

/**
 * GET /api/games/:id
 * Get game state.
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const game = await turnGameEngine.getGame(req.params.id as string, req.userId!);
    return res.json({ success: true, data: game });
  } catch (err: any) {
    console.error('[TurnGames] Get game error:', err);
    if (err.message?.includes('not found')) {
      return res.status(404).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to get game' });
  }
});

/**
 * POST /api/games/:id/move
 * Make a move in a turn-based game.
 */
router.post('/:id/move', authenticate, async (req: Request, res: Response) => {
  try {
    const { moveData } = req.body;
    if (!moveData) {
      return res.status(400).json({ success: false, message: 'moveData is required' });
    }

    const result = await turnGameEngine.makeMove(
      req.params.id as string,
      req.userId!,
      moveData
    );

    return res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[TurnGames] Move error:', err);
    if (
      err.message?.includes('Not your turn') ||
      err.message?.includes('Invalid') ||
      err.message?.includes('Illegal') ||
      err.message?.includes('occupied') ||
      err.message?.includes('No piece') ||
      err.message?.includes('Not your piece')
    ) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err.message?.includes('not found') || err.message?.includes('completed')) {
      return res.status(404).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: err.message || 'Failed to make move' });
  }
});

/**
 * GET /api/games/:id/moves
 * Get move history for a game.
 */
router.get('/:id/moves', authenticate, async (req: Request, res: Response) => {
  try {
    const moves = await turnGameEngine.getMoves(req.params.id as string);
    return res.json({ success: true, data: { moves } });
  } catch (err: any) {
    console.error('[TurnGames] Get moves error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get moves' });
  }
});

export const turnGamesRouter = router;
export default router;
