// Database adapter: uses Neon Postgres when DATABASE_URL is set (production on
// Vercel), otherwise falls back to an embedded PGlite database stored in
// .data/pglite so the app runs locally with zero setup.

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY,
  data JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  includes TEXT NOT NULL DEFAULT '',
  discounts TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS addons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL DEFAULT '',
  client_email TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT 'Quote',
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  items JSONB NOT NULL DEFAULT '[]',
  signature_name TEXT,
  accepted_at TIMESTAMPTZ,
  accepted_ip TEXT,
  accepted_totals JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

// Starter catalog from the July 2026 brand standards (§11 canonical pricing).
// Only runs when the collections table is empty — everything is editable in
// the admin afterward.
async function seedIfEmpty(query) {
  const existing = await query('SELECT id FROM collections LIMIT 1');
  if (existing.rows.length) return;
  const collections = [
    ['seed-core', 'Core', 525000, '8×8 album · 10 pages included', 1],
    ['seed-classic', 'Classic', 655000, '10×10 album · 15 pages included', 2],
    ['seed-premier', 'Premier', 775000, '12×12 album · 20 pages included', 3],
  ];
  for (const [id, name, price, includes, position] of collections) {
    await query(
      `INSERT INTO collections (id, name, price_cents, includes, position)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
      [id, name, price, includes, position]
    );
  }
  await query(
    `INSERT INTO addons (id, name, unit_price_cents, description, position)
     VALUES ('seed-hours', 'Additional Hours', 55000, 'Per additional hour of coverage', 1)
     ON CONFLICT (id) DO NOTHING`
  );
}

async function createClient() {
  if (process.env.DATABASE_URL) {
    const { Pool } = await import('@neondatabase/serverless');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query(SCHEMA);
    const runQuery = (text, params) => pool.query(text, params);
    await seedIfEmpty(runQuery);
    return { query: runQuery };
  }
  const { PGlite } = await import('@electric-sql/pglite');
  const path = await import('node:path');
  const { mkdirSync } = await import('node:fs');
  const dataDir = path.join(process.cwd(), '.data', 'pglite');
  mkdirSync(dataDir, { recursive: true });
  const db = new PGlite(dataDir);
  await db.waitReady;
  await db.exec(SCHEMA);
  const runQuery = (text, params) => db.query(text, params);
  await seedIfEmpty(runQuery);
  return { query: runQuery };
}

export function getDb() {
  // Cache on globalThis so Next.js hot reloads in dev don't open the
  // embedded database twice (PGlite allows only one connection per dir).
  if (!globalThis.__quoteDb) {
    globalThis.__quoteDb = createClient().catch((error) => {
      globalThis.__quoteDb = null;
      throw error;
    });
  }
  return globalThis.__quoteDb;
}

export async function query(text, params) {
  const db = await getDb();
  const result = await db.query(text, params);
  return result.rows;
}
