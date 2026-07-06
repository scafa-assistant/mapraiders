// ============================================================
// PostgreSQL + PostGIS Connection Pool
// ============================================================

import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.DATABASE_URL) {
  console.error('[FATAL] DATABASE_URL environment variable is required in production');
  process.exit(1);
}

const poolConfig: PoolConfig = {
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/mapraiders',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // DATABASE_SSL=false erlaubt lokale Docker-Postgres ohne SSL (Hetzner-Setup)
  ...(isProduction && process.env.DATABASE_SSL !== 'false' ? { ssl: { rejectUnauthorized: true } } : {}),
};

export const pool = new Pool(poolConfig);

// Log unexpected pool-level errors so they don't crash silently
pool.on('error', (err: Error) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

// ---- Initialization --------------------------------------------------

/**
 * Verify database connectivity and ensure required extensions are present.
 * Call once at server start.
 */
export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW() AS now');
    console.log(`[DB] Connected to PostgreSQL at ${result.rows[0].now}`);

    // PostGIS
    try {
      await client.query('SELECT PostGIS_Version()');
      console.log('[DB] PostGIS extension confirmed');
    } catch {
      console.log('[DB] PostGIS not found, attempting to create extension...');
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS postgis');
        console.log('[DB] PostGIS extension created');
      } catch (extErr: any) {
        console.warn('[DB] Could not create PostGIS extension:', extErr.message);
      }
    }

    // uuid-ossp
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    } catch {
      // pgcrypto fallback (gen_random_uuid)
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
      } catch {
        // ignore -- the DB may already have it
      }
    }

    // One-layer world map: real OSM buildings claimed as game buildings.
    // Self-applying (idempotent) so a plain deploy+restart provisions it.
    await client.query(`
      CREATE TABLE IF NOT EXISTS claimed_buildings (
        osm_id        TEXT PRIMARY KEY,
        owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        building_type TEXT NOT NULL DEFAULT 'workshop',
        lat           DOUBLE PRECISION NOT NULL,
        lng           DOUBLE PRECISION NOT NULL,
        claimed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_claimed_buildings_bbox ON claimed_buildings (lat, lng);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_claimed_buildings_owner ON claimed_buildings (owner_id);`);
  } finally {
    client.release();
  }
}

// ---- Query helpers ---------------------------------------------------

/**
 * Execute a parameterised query against the pool.
 * Logs a warning for queries that take longer than 1 second.
 */
export async function query<T extends Record<string, any> = any>(
  text: string,
  params?: any[],
): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (duration > 1000) {
    console.warn(`[DB] Slow query (${duration}ms): ${text.substring(0, 120)}`);
  }
  return result;
}

/**
 * Return the first row of a query, or null if there are no results.
 */
export async function queryOne<T extends Record<string, any> = any>(
  text: string,
  params?: any[],
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] ?? null;
}

/**
 * Return all rows of a query.
 */
export async function queryMany<T extends Record<string, any> = any>(
  text: string,
  params?: any[],
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

/**
 * Execute a callback inside a database transaction.
 * Automatically commits on success and rolls back on error.
 */
export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
