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
ALTER TABLE collections ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'wedding';
ALTER TABLE addons ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'both';
ALTER TABLE addons ADD COLUMN IF NOT EXISTS parent_collection_id TEXT NOT NULL DEFAULT '';
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

// Starter catalog - July 2026 pricing. Only runs when the catalog (both
// collections AND add-ons) is completely empty, so it never overwrites
// hand-entered data. Deleting every catalog entry in the admin and reloading
// the catalog page restores this list.
//
// Add-on prices that vary by collection follow the 17hats pattern - separate
// quantity lines per rate for album pages, and the other collection rates
// listed as fine print under each collection / in the add-on description.
const SEED_COLLECTIONS = [
  // [id, name, priceCents, includes, finePrint]
  [
    'seed-keepsake',
    'Keepsake',
    230000,
    '24x36 Canvas\n16x24 Canvas\n20 pages toward album design\nAlbum Presentation Box',
    'Keepsake pricing\n- Additional album pages $35 ea.\n- Duplicate 8x8 album $850\n- Printed proofs (set) $850\n- Proof book $750\n- Full gallery AI retouch $1300',
  ],
  [
    'seed-heirloom',
    'Heirloom',
    400000,
    '24x36 Acrylic\n16x24 Acrylic\n40 pages toward album design\nAlbum Presentation Box\nFull Gallery AI Retouch',
    'Heirloom pricing\n- Additional album pages $30 ea.\n- Duplicate 8x8 album $800\n- Printed proofs (set) $750\n- Proof book $650',
  ],
  [
    'seed-legacy',
    'Legacy',
    590000,
    '30x40 Acrylic\n24x36 Acrylic\n60 pages toward album design\nAlbum Presentation Box\nFull Gallery AI Retouch\nProof Book',
    'Legacy pricing\n- Additional album pages $25 ea.\n- Duplicate 8x8 album $750\n- Printed proofs (set) $650',
  ],
];

const SEED_ADDONS = [
  // [id, name, unitPriceCents, description, category, parentCollectionId]
  // Attached page lines render indented under their collection and only
  // appear on quotes that carry that collection.
  ['seed-pages', 'Additional Album Pages', 4000, 'A la carte, per page', 'album', ''],
  ['seed-pages-keepsake', 'Additional Album Pages - Keepsake', 3500, 'Per page', 'wedding', 'seed-keepsake'],
  ['seed-pages-heirloom', 'Additional Album Pages - Heirloom', 3000, 'Per page', 'wedding', 'seed-heirloom'],
  ['seed-pages-legacy', 'Additional Album Pages - Legacy', 2500, 'Per page', 'wedding', 'seed-legacy'],
  ['seed-dup-album', 'Duplicate 8x8 Album', 95000, 'A la carte. Keepsake $850, Heirloom $800, Legacy $750', 'both', ''],
  ['seed-proofs', 'Printed Proofs (set)', 100000, 'A la carte. Keepsake $850, Heirloom $750, Legacy $650', 'both', ''],
  ['seed-proof-book', 'Proof Book', 85000, 'A la carte. Keepsake $750, Heirloom $650, included with Legacy', 'both', ''],
  ['seed-retouch', 'Full Gallery AI Retouch', 150000, 'A la carte. Keepsake $1300, included with Heirloom and Legacy', 'both', ''],
  ['seed-box', 'Album Presentation Box', 25000, 'A la carte. Included with every collection', 'both', ''],
  // Wall art + prints - full price in every mode, shown on album quotes.
  ['seed-acrylic-8x10', 'Acrylic 8x10', 35000, '', 'album'],
  ['seed-acrylic-8x12', 'Acrylic 8x12', 37500, '', 'album'],
  ['seed-acrylic-12x12', 'Acrylic 12x12', 40000, '', 'album'],
  ['seed-acrylic-11x14', 'Acrylic 11x14', 47500, '', 'album'],
  ['seed-acrylic-16x20', 'Acrylic 16x20', 60000, '', 'album'],
  ['seed-acrylic-16x24', 'Acrylic 16x24', 70000, '', 'album'],
  ['seed-acrylic-20x30', 'Acrylic 20x30', 85000, '', 'album'],
  ['seed-acrylic-24x36', 'Acrylic 24x36', 115000, '', 'album'],
  ['seed-acrylic-30x40', 'Acrylic 30x40', 175000, '', 'album'],
  ['seed-canvas-8x10', 'Canvas 8x10', 30000, '', 'album'],
  ['seed-canvas-12x12', 'Canvas 12x12', 32500, '', 'album'],
  ['seed-canvas-11x14', 'Canvas 11x14', 35000, '', 'album'],
  ['seed-canvas-16x16', 'Canvas 16x16', 40000, '', 'album'],
  ['seed-canvas-16x20', 'Canvas 16x20', 42500, '', 'album'],
  ['seed-canvas-16x24', 'Canvas 16x24', 45000, '', 'album'],
  ['seed-canvas-20x30', 'Canvas 20x30', 60000, '', 'album'],
  ['seed-canvas-24x36', 'Canvas 24x36', 77500, '', 'album'],
  ['seed-canvas-30x40', 'Canvas 30x40', 85000, '', 'album'],
  ['seed-metal-16x20', 'Metal 16x20', 45000, '', 'album'],
  ['seed-metal-16x24', 'Metal 16x24', 52500, '', 'album'],
  ['seed-metal-24x36', 'Metal 24x36', 97500, '', 'album'],
  ['seed-print-8x10', 'Print 8x10', 5000, '', 'album'],
  ['seed-print-11x14', 'Print 11x14', 10000, '', 'album'],
  ['seed-print-16x20', 'Print 16x20', 17500, '', 'album'],
];

async function seedIfEmpty(query) {
  const collections = await query('SELECT id FROM collections LIMIT 1');
  const addons = await query('SELECT id FROM addons LIMIT 1');
  if (collections.rows.length || addons.rows.length) return;
  let position = 0;
  for (const [id, name, price, includes, finePrint] of SEED_COLLECTIONS) {
    position += 1;
    await query(
      `INSERT INTO collections (id, name, price_cents, includes, discounts, position, category)
       VALUES ($1, $2, $3, $4, $5, $6, 'wedding') ON CONFLICT (id) DO NOTHING`,
      [id, name, price, includes, finePrint, position]
    );
  }
  position = 0;
  for (const [id, name, price, description, category, parentId = ''] of SEED_ADDONS) {
    position += 1;
    await query(
      `INSERT INTO addons (id, name, unit_price_cents, description, position, category, parent_collection_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
      [id, name, price, description, position, category, parentId]
    );
  }
}

// Called from the admin catalog page so that emptying the catalog and
// reloading that page deterministically restores the starter list above.
export async function ensureSeeded() {
  const db = await getDb();
  await seedIfEmpty((text, params) => db.query(text, params));
}

// True when running on Vercel without a database attached. The PGlite
// fallback only works locally — Vercel's filesystem is read-only.
export function missingDatabaseUrl() {
  return !!process.env.VERCEL && !process.env.DATABASE_URL;
}

async function createClient() {
  if (missingDatabaseUrl()) {
    throw new Error(
      'DATABASE_URL is not set. Create a Neon Postgres database in the Vercel Storage tab, make sure it is connected to this environment, then redeploy.'
    );
  }
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
