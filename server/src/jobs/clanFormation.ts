// ============================================================
// Clan Formation Job
// Detects organic clans from player behaviour patterns.
// District clans, commute-route clans, and dog-park clans.
// ============================================================

import { query, queryMany } from '../config/database';
import { notifyClanFormed } from '../services/notificationService';

/**
 * Run the full clan formation process.
 * Called daily at 03:00 by the cron scheduler.
 *
 * Three clan categories:
 * 1. District clans   - users with the most territory in a geographic grid cell
 * 2. Route-pattern clans - users with similar commute routes at similar times
 * 3. Dog-park clans   - dog_walker class users who frequent the same area
 */
export async function runClanFormation(): Promise<{ created: number }> {
  let total = 0;

  try {
    const districtCount = await formDistrictClans();
    total += districtCount;
  } catch (err) {
    console.error('[ClanFormation] District clan formation failed:', err);
  }

  try {
    const routeCount = await formRoutePatternClans();
    total += routeCount;
  } catch (err) {
    console.error('[ClanFormation] Route-pattern clan formation failed:', err);
  }

  try {
    const dogParkCount = await formDogParkClans();
    total += dogParkCount;
  } catch (err) {
    console.error('[ClanFormation] Dog-park clan formation failed:', err);
  }

  return { created: total };
}

// ---- District Clans ---------------------------------------------------
// Group territories by a coarse lat/lng grid (0.01 degree ~ 1 km cells).
// Top 10 users per district cell -> create/update a district clan.

async function formDistrictClans(): Promise<number> {
  let formed = 0;

  // Find the top 10 territory holders per grid cell.
  // Grid cell is defined by rounding lat/lng to 2 decimal places (~ 1 km).
  const cells = await queryMany<{
    grid_lat: number;
    grid_lng: number;
    owner_id: string;
    cell_value: string;
  }>(
    `SELECT
       ROUND(ST_Y(ST_Centroid(polygon))::numeric, 2) AS grid_lat,
       ROUND(ST_X(ST_Centroid(polygon))::numeric, 2) AS grid_lng,
       owner_id,
       SUM(claim_value) AS cell_value
     FROM territories
     WHERE owner_id IS NOT NULL
     GROUP BY grid_lat, grid_lng, owner_id
     ORDER BY grid_lat, grid_lng, cell_value DESC`,
  );

  // Group by grid cell
  const cellMap = new Map<string, { userId: string; value: number }[]>();
  for (const row of cells) {
    const key = `${row.grid_lat}_${row.grid_lng}`;
    if (!cellMap.has(key)) cellMap.set(key, []);
    cellMap.get(key)!.push({
      userId: row.owner_id,
      value: parseFloat(row.cell_value),
    });
  }

  for (const [cellKey, members] of cellMap) {
    // Only form a clan if there are at least 3 members
    if (members.length < 3) continue;

    const topMembers = members.slice(0, 10);
    const [gridLat, gridLng] = cellKey.split('_').map(Number);
    const clanName = `District ${gridLat.toFixed(2)},${gridLng.toFixed(2)}`;

    try {
      // Upsert clan
      const clanResult = await query(
        `INSERT INTO clans (type, name, auto_generated, metadata, created_at)
         VALUES ('district', $1, true, $2, NOW())
         ON CONFLICT (type, name)
         DO UPDATE SET metadata = $2
         RETURNING id`,
        [
          clanName,
          JSON.stringify({
            grid_lat: gridLat,
            grid_lng: gridLng,
            member_count: topMembers.length,
          }),
        ],
      );

      const clanId = clanResult.rows[0]?.id;
      if (!clanId) continue;

      // Clear existing memberships and re-insert
      await query(
        `DELETE FROM clan_members WHERE clan_id = $1`,
        [clanId],
      );

      for (let i = 0; i < topMembers.length; i++) {
        await query(
          `INSERT INTO clan_members (clan_id, user_id, joined_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT DO NOTHING`,
          [clanId, topMembers[i].userId],
        );
      }

      // Notify new members
      for (const member of topMembers) {
        try {
          await notifyClanFormed(member.userId, clanId, clanName);
        } catch {
          // Non-critical: notification failure should not block formation
        }
      }

      formed++;
    } catch (err) {
      console.error(`[ClanFormation] Failed to form district clan "${clanName}":`, err);
    }
  }

  console.log(`[ClanFormation] District clans formed/updated: ${formed}`);
  return formed;
}

// ---- Route-Pattern Clans (Commute) ------------------------------------
// Find users with routes starting/ending in the same ~500 m radius,
// at the same hour of day, at least 3 times in the last 7 days.

async function formRoutePatternClans(): Promise<number> {
  let formed = 0;

  // Identify pairs of users with overlapping start/end regions and
  // similar departure times (same hour, within 7 days, >= 3 co-occurrences).
  const candidates = await queryMany<{
    user_a: string;
    user_b: string;
    start_lat: number;
    start_lng: number;
    route_hour: number;
    overlap_count: string;
  }>(
    `WITH route_cells AS (
       SELECT
         r.user_id,
         ROUND(ST_Y(ST_PointN(ST_ExteriorRing(r.polygon::geometry), 1))::numeric, 3) AS start_lat,
         ROUND(ST_X(ST_PointN(ST_ExteriorRing(r.polygon::geometry), 1))::numeric, 3) AS start_lng,
         ROUND(ST_Y(ST_PointN(ST_ExteriorRing(r.polygon::geometry), ST_NPoints(ST_ExteriorRing(r.polygon::geometry))))::numeric, 3) AS end_lat,
         ROUND(ST_X(ST_PointN(ST_ExteriorRing(r.polygon::geometry), ST_NPoints(ST_ExteriorRing(r.polygon::geometry))))::numeric, 3) AS end_lng,
         EXTRACT(HOUR FROM r.created_at) AS route_hour,
         r.created_at
       FROM routes r
       WHERE r.created_at > NOW() - INTERVAL '7 days'
     )
     SELECT
       rc1.user_id AS user_a,
       rc2.user_id AS user_b,
       rc1.start_lat,
       rc1.start_lng,
       rc1.route_hour,
       COUNT(*) AS overlap_count
     FROM route_cells rc1
     JOIN route_cells rc2
       ON rc1.user_id < rc2.user_id
       AND rc1.start_lat = rc2.start_lat
       AND rc1.start_lng = rc2.start_lng
       AND rc1.end_lat = rc2.end_lat
       AND rc1.end_lng = rc2.end_lng
       AND rc1.route_hour = rc2.route_hour
     GROUP BY rc1.user_id, rc2.user_id, rc1.start_lat, rc1.start_lng, rc1.route_hour
     HAVING COUNT(*) >= 3
     ORDER BY overlap_count DESC
     LIMIT 200`,
  );

  // Build connected groups from overlapping pairs
  const groups = buildConnectedGroups(
    candidates.map((c) => [c.user_a, c.user_b] as [string, string]),
  );

  for (const group of groups) {
    if (group.length < 3) continue;

    // Use the first candidate's location for the clan name
    const matching = candidates.find(
      (c) => group.includes(c.user_a) && group.includes(c.user_b),
    );
    const clanName = matching
      ? `Commute ${matching.start_lat.toFixed(3)},${matching.start_lng.toFixed(3)} H${matching.route_hour}`
      : `Commute Clan ${Date.now()}`;

    try {
      const clanResult = await query(
        `INSERT INTO clans (type, name, auto_generated, metadata, created_at)
         VALUES ('commute', $1, true, $2, NOW())
         ON CONFLICT (type, name)
         DO UPDATE SET metadata = $2
         RETURNING id`,
        [
          clanName,
          JSON.stringify({ member_count: group.length }),
        ],
      );

      const clanId = clanResult.rows[0]?.id;
      if (!clanId) continue;

      await query(`DELETE FROM clan_members WHERE clan_id = $1`, [clanId]);

      for (let i = 0; i < group.length; i++) {
        await query(
          `INSERT INTO clan_members (clan_id, user_id, joined_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT DO NOTHING`,
          [clanId, group[i]],
        );
      }

      for (const userId of group) {
        try {
          await notifyClanFormed(userId, clanId, clanName);
        } catch {
          // Non-critical
        }
      }

      formed++;
    } catch (err) {
      console.error(`[ClanFormation] Failed to form commute clan "${clanName}":`, err);
    }
  }

  console.log(`[ClanFormation] Route-pattern clans formed/updated: ${formed}`);
  return formed;
}

// ---- Dog-Park Clans ---------------------------------------------------
// Find dog_walker class users whose routes overlap in the same ~500 m area
// at least 3 times in the last 7 days.

async function formDogParkClans(): Promise<number> {
  let formed = 0;

  const candidates = await queryMany<{
    user_a: string;
    user_b: string;
    area_lat: number;
    area_lng: number;
    overlap_count: string;
  }>(
    `WITH dog_routes AS (
       SELECT
         r.user_id,
         ROUND(ST_Y(ST_Centroid(r.polygon::geometry))::numeric, 3) AS area_lat,
         ROUND(ST_X(ST_Centroid(r.polygon::geometry))::numeric, 3) AS area_lng,
         r.created_at
       FROM routes r
       WHERE r.class = 'dog_walker'
         AND r.created_at > NOW() - INTERVAL '7 days'
     )
     SELECT
       dr1.user_id AS user_a,
       dr2.user_id AS user_b,
       dr1.area_lat,
       dr1.area_lng,
       COUNT(*) AS overlap_count
     FROM dog_routes dr1
     JOIN dog_routes dr2
       ON dr1.user_id < dr2.user_id
       AND dr1.area_lat = dr2.area_lat
       AND dr1.area_lng = dr2.area_lng
     GROUP BY dr1.user_id, dr2.user_id, dr1.area_lat, dr1.area_lng
     HAVING COUNT(*) >= 3
     ORDER BY overlap_count DESC
     LIMIT 200`,
  );

  const groups = buildConnectedGroups(
    candidates.map((c) => [c.user_a, c.user_b] as [string, string]),
  );

  for (const group of groups) {
    if (group.length < 3) continue;

    const matching = candidates.find(
      (c) => group.includes(c.user_a) && group.includes(c.user_b),
    );
    const clanName = matching
      ? `Dog Park ${matching.area_lat.toFixed(3)},${matching.area_lng.toFixed(3)}`
      : `Dog Park Clan ${Date.now()}`;

    try {
      const clanResult = await query(
        `INSERT INTO clans (type, name, auto_generated, metadata, created_at)
         VALUES ('dog_park', $1, true, $2, NOW())
         ON CONFLICT (type, name)
         DO UPDATE SET metadata = $2
         RETURNING id`,
        [
          clanName,
          JSON.stringify({ member_count: group.length }),
        ],
      );

      const clanId = clanResult.rows[0]?.id;
      if (!clanId) continue;

      await query(`DELETE FROM clan_members WHERE clan_id = $1`, [clanId]);

      for (let i = 0; i < group.length; i++) {
        await query(
          `INSERT INTO clan_members (clan_id, user_id, joined_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT DO NOTHING`,
          [clanId, group[i]],
        );
      }

      for (const userId of group) {
        try {
          await notifyClanFormed(userId, clanId, clanName);
        } catch {
          // Non-critical
        }
      }

      formed++;
    } catch (err) {
      console.error(`[ClanFormation] Failed to form dog-park clan "${clanName}":`, err);
    }
  }

  console.log(`[ClanFormation] Dog-park clans formed/updated: ${formed}`);
  return formed;
}

// ---- Helpers ----------------------------------------------------------

/**
 * Build connected groups from a list of (user_a, user_b) pairs using
 * a union-find / connected-components approach.
 */
function buildConnectedGroups(pairs: [string, string][]): string[][] {
  const parent = new Map<string, string>();

  function find(x: string): string {
    if (!parent.has(x)) parent.set(x, x);
    let root = x;
    while (parent.get(root) !== root) {
      root = parent.get(root)!;
    }
    // Path compression
    let curr = x;
    while (curr !== root) {
      const next = parent.get(curr)!;
      parent.set(curr, root);
      curr = next;
    }
    return root;
  }

  function union(a: string, b: string): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) {
      parent.set(ra, rb);
    }
  }

  for (const [a, b] of pairs) {
    union(a, b);
  }

  // Collect groups
  const groups = new Map<string, string[]>();
  for (const node of parent.keys()) {
    const root = find(node);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(node);
  }

  return Array.from(groups.values());
}
