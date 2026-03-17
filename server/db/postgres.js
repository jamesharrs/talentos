// server/db/postgres.js
// PostgreSQL adapter — same interface as the JSON file store.
// When DATABASE_URL is set, uses Postgres. Otherwise falls back to JSON.
// Routes never need to change — they all use getStore()/saveStore() from init.js.

const { Pool } = require('pg');

let pool = null;
let pgEnabled = false;

function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('railway') || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    pool.on('error', (err) => console.error('PG pool error:', err.message));
    pgEnabled = true;
  }
  return pool;
}

function isEnabled() { return pgEnabled && !!pool; }

// ── Bootstrap schema ──────────────────────────────────────────────────────────
// Uses a single JSONB-per-collection design so the existing JSON store API
// maps 1:1. Each tenant gets its own rows; no schema migrations needed when
// new collections are added (they auto-create on first save).
const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS talentos_store (
  id          SERIAL PRIMARY KEY,
  tenant_slug TEXT    NOT NULL DEFAULT 'master',
  collection  TEXT    NOT NULL,
  data        JSONB   NOT NULL DEFAULT '[]'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_slug, collection)
);
CREATE INDEX IF NOT EXISTS idx_talentos_store_tenant
  ON talentos_store (tenant_slug);
`;

async function bootstrap() {
  const pg = getPool();
  if (!pg) return false;
  try {
    await pg.query(BOOTSTRAP_SQL);
    console.log('PostgreSQL: schema ready ✓');
    return true;
  } catch(e) {
    console.error('PostgreSQL bootstrap failed:', e.message);
    pgEnabled = false;
    return false;
  }
}

// ── Load all collections for a tenant into memory ─────────────────────────────
async function loadTenant(tenantSlug) {
  const pg = getPool();
  if (!pg) return null;
  try {
    const res = await pg.query(
      'SELECT collection, data FROM talentos_store WHERE tenant_slug = $1',
      [tenantSlug]
    );
    const store = {};
    for (const row of res.rows) {
      store[row.collection] = Array.isArray(row.data) ? row.data : (row.data || []);
    }
    return store;
  } catch(e) {
    console.error(`PG loadTenant(${tenantSlug}) error:`, e.message);
    return null;
  }
}

// ── Persist a single collection for a tenant ──────────────────────────────────
async function saveCollection(tenantSlug, collection, data) {
  const pg = getPool();
  if (!pg) return;
  try {
    await pg.query(
      `INSERT INTO talentos_store (tenant_slug, collection, data, updated_at)
       VALUES ($1, $2, $3::jsonb, NOW())
       ON CONFLICT (tenant_slug, collection)
       DO UPDATE SET data = $3::jsonb, updated_at = NOW()`,
      [tenantSlug, collection, JSON.stringify(data)]
    );
  } catch(e) {
    console.error(`PG saveCollection(${tenantSlug}.${collection}) error:`, e.message);
    throw e;
  }
}

// ── Persist the entire store object for a tenant ──────────────────────────────
async function saveTenant(tenantSlug, store) {
  const pg = getPool();
  if (!pg) return;
  try {
    const client = await pg.connect();
    try {
      await client.query('BEGIN');
      for (const [collection, data] of Object.entries(store)) {
        if (!Array.isArray(data) && typeof data !== 'object') continue;
        await client.query(
          `INSERT INTO talentos_store (tenant_slug, collection, data, updated_at)
           VALUES ($1, $2, $3::jsonb, NOW())
           ON CONFLICT (tenant_slug, collection)
           DO UPDATE SET data = $3::jsonb, updated_at = NOW()`,
          [tenantSlug, collection, JSON.stringify(data)]
        );
      }
      await client.query('COMMIT');
    } catch(e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch(e) {
    console.error(`PG saveTenant(${tenantSlug}) error:`, e.message);
    throw e;
  }
}

// ── List all tenant slugs ─────────────────────────────────────────────────────
async function listTenantSlugs() {
  const pg = getPool();
  if (!pg) return ['master'];
  try {
    const res = await pg.query(
      'SELECT DISTINCT tenant_slug FROM talentos_store ORDER BY tenant_slug'
    );
    return res.rows.map(r => r.tenant_slug);
  } catch(e) {
    return ['master'];
  }
}

// ── Migrate JSON store → Postgres ─────────────────────────────────────────────
// Reads all existing .json files from DATA_DIR and upserts them into Postgres.
// Safe to run multiple times (idempotent).
async function migrateFromJson(DATA_DIR) {
  const fs = require('fs');
  const path = require('path');
  if (!fs.existsSync(DATA_DIR)) return;
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json') && !f.endsWith('.sample.json'));
  for (const file of files) {
    const slug = file === 'talentos.json' ? 'master'
               : file.startsWith('tenant-') ? file.replace('tenant-','').replace('.json','')
               : null;
    if (!slug) continue;
    try {
      const store = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
      await saveTenant(slug, store);
      console.log(`PG: migrated ${file} → tenant:${slug}`);
    } catch(e) {
      console.error(`PG: migration failed for ${file}:`, e.message);
    }
  }
}

module.exports = { getPool, isEnabled, bootstrap, loadTenant, saveCollection, saveTenant, listTenantSlugs, migrateFromJson };
