// ============================================================
// PostgreSQL + PostGIS Connection Pool
// ============================================================

import { Pool, PoolClient, PoolConfig, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/gridwalker',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
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
