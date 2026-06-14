// ============================================================
// Extraction Service (Phase F.1)
// Biome-gated extraction buildings (sawmill / quarry / farm / fishery)
// accrue a RAW resource into a per-TERRITORY stockpile over time. The
// stockpile is per (territory_id, resource); hauling stockpile→player
// balance is a LATER phase, so nothing here ever touches player_resources.
//
// Accrual model (mirrors energyService's lazy+cron hybrid):
//   produced = ratePerHour × TIER_RATE_MULT[tier-1]
//              × hoursSince(stockpile.updated_at, capped MAX_ACCRUAL_HOURS)
//   amount   = min(cap, amount + produced)
//
// territory_stockpile.updated_at is the per-resource WATERMARK. A FOR UPDATE
// lock on that row serialises lazy (on-request) and cron accrual so the same
// hours can never be credited twice. A freshly-created stockpile row starts at
// NOW() with amount 0 — no retroactive windfall on the first accrual.
//
// Composition rule: every method accepts an optional PoolClient. When supplied
// the work runs inside the caller's transaction; when omitted it opens its own.
// Never opens a second pool connection while holding the caller's row lock.
// ============================================================

import { PoolClient } from 'pg';
import { transaction } from '../config/database';
import { EXTRACTION, EXTRACTION_TYPES, ExtractionType } from '../config/constants';

/** Run `fn` inside the supplied client, or open a fresh transaction. */
async function withClient<T>(
  client: PoolClient | undefined,
  fn: (c: PoolClient) => Promise<T>,
): Promise<T> {
  if (client) return fn(client);
  return transaction(fn);
}

/** One entry of a territory's readable stockpile. */
export interface StockpileEntry {
  resource: string;
  amount: number;
  cap: number;
  ratePerHour: number;
}

/**
 * Active extraction building rows on a territory, reduced to the fields the
 * accrual maths needs.
 */
interface ActiveExtractor {
  type: ExtractionType;
  tier: number;
}

class ExtractionService {
  /** Output multiplier for a tier (1..3), clamped into TIER_RATE_MULT range. */
  private rateMult(tier: number): number {
    const table = EXTRACTION.TIER_RATE_MULT;
    const idx = Math.max(0, Math.min(table.length - 1, (tier || 1) - 1));
    return table[idx];
  }

  /**
   * Load the ACTIVE extraction buildings on a territory (owner's structures),
   * collapsed to { type, tier }. Only the four extraction types are returned.
   */
  private async loadActiveExtractors(
    territoryId: string,
    c: PoolClient,
  ): Promise<ActiveExtractor[]> {
    const res = await c.query<{ type: string; tier: number }>(
      `SELECT type, tier
         FROM buildings
        WHERE territory_id = $1
          AND status = 'active'
          AND type = ANY($2)`,
      [territoryId, EXTRACTION_TYPES as readonly string[]],
    );
    return res.rows
      .filter((r): r is { type: ExtractionType; tier: number } =>
        (EXTRACTION_TYPES as readonly string[]).includes(r.type),
      )
      .map((r) => ({ type: r.type, tier: r.tier || 1 }));
  }

  /**
   * Group active extractors by the resource they produce, summing the per-hour
   * (tier-scaled) production and tracking the aggregate cap for each resource.
   * cap = sum of caps of the contributing buildings (so two food buildings can
   * stockpile more food than one).
   */
  private aggregate(
    extractors: ActiveExtractor[],
  ): Map<string, { ratePerHour: number; cap: number }> {
    const byResource = new Map<string, { ratePerHour: number; cap: number }>();
    for (const e of extractors) {
      const def = EXTRACTION[e.type];
      const rate = def.ratePerHour * this.rateMult(e.tier);
      const entry = byResource.get(def.resource) ?? { ratePerHour: 0, cap: 0 };
      entry.ratePerHour += rate;
      entry.cap += def.cap;
      byResource.set(def.resource, entry);
    }
    return byResource;
  }

  /**
   * Accrue raw resources into a territory's stockpile since each resource row's
   * last watermark. For every resource produced by an active extraction building
   * on the territory:
   *   1. Lazily create the (territory, resource) stockpile row at NOW(), amount 0.
   *   2. Lock it FOR UPDATE; read amount + updated_at.
   *   3. produced = Σ(rate × tierMult) × hours(capped) over contributing buildings.
   *   4. amount = min(aggregateCap, amount + floor(produced)).
   *   5. Always advance updated_at = NOW() (even on 0) so remainders don't pile up.
   *
   * A fresh row credits nothing on its first accrual (no retroactive windfall),
   * exactly like energyService's energy_ticks bootstrap.
   *
   * @returns total raw units added across all resources (>= 0)
   */
  async accrueTerritory(territoryId: string, client?: PoolClient): Promise<number> {
    return withClient(client, async (c) => {
      const extractors = await this.loadActiveExtractors(territoryId, c);
      if (extractors.length === 0) return 0;

      const byResource = this.aggregate(extractors);
      let totalAdded = 0;

      for (const [resource, agg] of byResource) {
        // 1. Lazily create the watermark row (no-op if it exists).
        const inserted = await c.query(
          `INSERT INTO territory_stockpile (territory_id, resource, amount, updated_at)
           VALUES ($1, $2, 0, NOW())
           ON CONFLICT (territory_id, resource) DO NOTHING`,
          [territoryId, resource],
        );

        // 2. Lock the row + read the watermark.
        const row = await c.query<{ amount: string; updated_at: Date }>(
          `SELECT amount, updated_at
             FROM territory_stockpile
            WHERE territory_id = $1 AND resource = $2
            FOR UPDATE`,
          [territoryId, resource],
        );
        if (row.rowCount === 0) continue; // defensive — should exist after upsert

        // Fresh row → no retroactive accrual on first call.
        if ((inserted.rowCount ?? 0) > 0) continue;

        const lastTick = new Date(row.rows[0].updated_at).getTime();
        const elapsedHoursRaw = (Date.now() - lastTick) / (1000 * 60 * 60);
        const hours = Math.min(
          Math.max(elapsedHoursRaw, 0),
          EXTRACTION.MAX_ACCRUAL_HOURS,
        );

        // Too soon to bother — leave the watermark so sub-threshold time is kept.
        if (hours < 0.1) continue;

        const current = parseInt(row.rows[0].amount, 10) || 0;
        const produced = Math.floor(agg.ratePerHour * hours);
        const next = Math.min(agg.cap, current + Math.max(0, produced));
        const delta = next - current;

        await c.query(
          `UPDATE territory_stockpile
              SET amount = $3, updated_at = NOW()
            WHERE territory_id = $1 AND resource = $2`,
          [territoryId, resource, next],
        );

        if (delta > 0) totalAdded += delta;
      }

      return totalAdded;
    });
  }

  /**
   * Return a territory's stockpile (materialised: runs accrueTerritory first,
   * then reads). For each resource produced by an active extraction building it
   * returns { resource, amount, cap, ratePerHour }. Resources with no active
   * producer are omitted. cap/ratePerHour are aggregated from the territory's
   * extraction buildings (same maths accrual uses).
   */
  async getStockpile(territoryId: string, client?: PoolClient): Promise<StockpileEntry[]> {
    return withClient(client, async (c) => {
      // Materialise first so the returned amounts are current.
      await this.accrueTerritory(territoryId, c);

      const extractors = await this.loadActiveExtractors(territoryId, c);
      if (extractors.length === 0) return [];

      const byResource = this.aggregate(extractors);
      const resources = Array.from(byResource.keys());

      const stored = await c.query<{ resource: string; amount: string }>(
        `SELECT resource, amount
           FROM territory_stockpile
          WHERE territory_id = $1 AND resource = ANY($2)`,
        [territoryId, resources],
      );
      const amountByResource = new Map<string, number>();
      for (const r of stored.rows) {
        amountByResource.set(r.resource, parseInt(r.amount, 10) || 0);
      }

      const out: StockpileEntry[] = [];
      for (const [resource, agg] of byResource) {
        out.push({
          resource,
          amount: amountByResource.get(resource) ?? 0,
          cap: agg.cap,
          ratePerHour: agg.ratePerHour,
        });
      }
      // Stable ordering for deterministic responses.
      out.sort((a, b) => a.resource.localeCompare(b.resource));
      return out;
    });
  }

  /**
   * Cron entry: accrue every territory that has at least one ACTIVE extraction
   * building. Per-territory try/catch so one bad territory can't abort the batch.
   *
   * @returns number of territories that received a positive stockpile credit
   */
  async runExtractionTickBatch(): Promise<number> {
    let territoryIds: string[] = [];
    try {
      const res = await transaction((c) =>
        c.query<{ territory_id: string }>(
          `SELECT DISTINCT territory_id
             FROM buildings
            WHERE status = 'active' AND type = ANY($1)`,
          [EXTRACTION_TYPES as readonly string[]],
        ),
      );
      territoryIds = res.rows.map((r) => r.territory_id);
    } catch (err) {
      console.error('[Extraction] Failed to load extraction territories:', err);
      return 0;
    }

    let credited = 0;
    for (const territoryId of territoryIds) {
      try {
        const added = await this.accrueTerritory(territoryId);
        if (added > 0) credited++;
      } catch (err) {
        console.error(`[Extraction] accrueTerritory failed for ${territoryId}:`, err);
      }
    }

    console.log(
      `[Extraction] Tick batch: ${credited}/${territoryIds.length} territories credited`,
    );
    return credited;
  }
}

export const extractionService = new ExtractionService();
export default extractionService;
