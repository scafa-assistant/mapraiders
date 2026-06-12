// ============================================================
// Inventory Routes (Phase 0 — E1)
// GET  /api/inventory       - Current user's items (filter category/status)
// GET  /api/inventory/:id   - Single owned item (404 if not owned)
//
// NOTE: not registered in index.ts yet (Phase 0 staging).
// ============================================================

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { itemService } from '../services/itemService';
import { ItemCategory, ItemStatus } from '../utils/types';

const router = Router();

const VALID_CATEGORIES: ItemCategory[] = ['dice', 'unit', 'card', 'relic', 'blueprint'];
const VALID_STATUSES: ItemStatus[] = [
  'inventory',
  'equipped',
  'deployed',
  'staked',
  'burned',
  'listed',
];

/**
 * GET /api/inventory
 * Returns the authenticated user's item instances joined with definitions.
 * Optional query filters: category, status (invalid values are ignored).
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const filters: { category?: ItemCategory; status?: ItemStatus } = {};

    const category = req.query.category as string | undefined;
    if (category && VALID_CATEGORIES.includes(category as ItemCategory)) {
      filters.category = category as ItemCategory;
    }

    const status = req.query.status as string | undefined;
    if (status && VALID_STATUSES.includes(status as ItemStatus)) {
      filters.status = status as ItemStatus;
    }

    const items = await itemService.getInventory(req.userId as string, filters);
    return res.json({ success: true, data: { items } });
  } catch (err: any) {
    console.error('[Inventory] Get inventory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load inventory' });
  }
});

/**
 * GET /api/inventory/:id
 * Returns a single item instance — only if owned by the requesting user.
 * Responds 404 otherwise (does not leak existence of others' items).
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const item = await itemService.getInstanceForOwner(
      req.params.id as string,
      req.userId as string,
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    return res.json({ success: true, data: { item } });
  } catch (err: any) {
    console.error('[Inventory] Get item error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load item' });
  }
});

export const inventoryRouter = router;
export default router;
