import { randomBytes } from 'node:crypto';
import { query } from './db';

export function newId() {
  return randomBytes(8).toString('hex');
}

export function newSlug() {
  // Unguessable public identifier for client-facing quote links.
  return randomBytes(16).toString('base64url');
}

// ---------- Settings ----------

export const DEFAULT_SETTINGS = {
  businessName: 'Anthony Niccoli Photography',
  taxRate: 0,
  introText: '',
  acceptanceText:
    'To indicate your acceptance of the above, sign electronically below.',
  // Optional. When a client accepts a quote, its details are POSTed here as
  // JSON - paste a Zapier Catch Hook URL to feed zaps (e.g. into Pixifi).
  webhookUrl: '',
};

export async function getSettings() {
  const rows = await query('SELECT data FROM settings WHERE id = 1');
  if (!rows.length) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...rows[0].data };
}

export async function saveSettings(data) {
  const merged = { ...DEFAULT_SETTINGS, ...data };
  await query(
    `INSERT INTO settings (id, data) VALUES (1, $1)
     ON CONFLICT (id) DO UPDATE SET data = $1`,
    [JSON.stringify(merged)]
  );
  return merged;
}

// ---------- Collections ----------

function collectionFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    priceCents: row.price_cents,
    includes: row.includes,
    discounts: row.discounts,
    position: row.position,
    active: row.active,
    category: row.category || 'wedding',
  };
}

export async function listCollections() {
  const rows = await query('SELECT * FROM collections ORDER BY position, name');
  return rows.map(collectionFromRow);
}

export async function createCollection(input) {
  const id = newId();
  const rows = await query('SELECT COALESCE(MAX(position), 0) + 1 AS pos FROM collections');
  await query(
    `INSERT INTO collections (id, name, price_cents, includes, discounts, position, active, category)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id,
      input.name || 'New Collection',
      input.priceCents ?? 0,
      input.includes || '',
      input.discounts || '',
      Number(rows[0].pos),
      input.active ?? true,
      input.category === 'album' ? 'album' : 'wedding',
    ]
  );
  return id;
}

export async function updateCollection(id, input) {
  await query(
    `UPDATE collections SET name = $2, price_cents = $3, includes = $4,
       discounts = $5, position = $6, active = $7, category = $8 WHERE id = $1`,
    [
      id,
      input.name,
      input.priceCents,
      input.includes,
      input.discounts,
      input.position,
      input.active,
      input.category === 'album' ? 'album' : 'wedding',
    ]
  );
}

export async function deleteCollection(id) {
  await query('DELETE FROM collections WHERE id = $1', [id]);
}

// ---------- Add-ons ----------

function addonFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    unitPriceCents: row.unit_price_cents,
    description: row.description,
    position: row.position,
    active: row.active,
    category: row.category || 'both',
    parentCollectionId: row.parent_collection_id || '',
    tierPrices: row.tier_prices || {},
    featured: !!row.featured,
  };
}

// Tier prices map collection ids to a discounted price in cents or the
// string 'included'. Anything else is dropped.
function cleanTierPrices(input) {
  const out = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (value === 'included') out[key] = 'included';
    else if (Number.isFinite(Number(value))) out[key] = Math.round(Number(value));
  }
  return out;
}

export async function listAddons() {
  const rows = await query('SELECT * FROM addons ORDER BY position, name');
  return rows.map(addonFromRow);
}

export async function createAddon(input) {
  const id = newId();
  const rows = await query('SELECT COALESCE(MAX(position), 0) + 1 AS pos FROM addons');
  await query(
    `INSERT INTO addons (id, name, unit_price_cents, description, position, active, category, parent_collection_id, tier_prices, featured)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      id,
      input.name || 'New Add-on',
      input.unitPriceCents ?? 0,
      input.description || '',
      Number(rows[0].pos),
      input.active ?? true,
      ['wedding', 'album', 'both'].includes(input.category) ? input.category : 'both',
      input.parentCollectionId || '',
      JSON.stringify(cleanTierPrices(input.tierPrices)),
      !!input.featured,
    ]
  );
  return id;
}

export async function updateAddon(id, input) {
  await query(
    `UPDATE addons SET name = $2, unit_price_cents = $3, description = $4,
       position = $5, active = $6, category = $7, parent_collection_id = $8,
       tier_prices = $9, featured = $10 WHERE id = $1`,
    [
      id,
      input.name,
      input.unitPriceCents,
      input.description,
      input.position,
      input.active,
      ['wedding', 'album', 'both'].includes(input.category) ? input.category : 'both',
      input.parentCollectionId || '',
      JSON.stringify(cleanTierPrices(input.tierPrices)),
      !!input.featured,
    ]
  );
}

export async function deleteAddon(id) {
  await query('DELETE FROM addons WHERE id = $1', [id]);
}

// ---------- Quotes ----------

function quoteFromRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    clientName: row.client_name,
    clientEmail: row.client_email,
    title: row.title,
    taxRate: Number(row.tax_rate),
    status: row.status,
    items: row.items || [],
    signatureName: row.signature_name,
    acceptedAt: row.accepted_at,
    acceptedIp: row.accepted_ip,
    acceptedTotals: row.accepted_totals,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listQuotes() {
  const rows = await query(
    `SELECT id, slug, client_name, client_email, title, status, tax_rate, items,
            signature_name, accepted_at, created_at, updated_at
     FROM quotes ORDER BY updated_at DESC`
  );
  return rows.map(quoteFromRow);
}

export async function getQuote(id) {
  const rows = await query('SELECT * FROM quotes WHERE id = $1', [id]);
  return rows.length ? quoteFromRow(rows[0]) : null;
}

export async function getQuoteBySlug(slug) {
  const rows = await query('SELECT * FROM quotes WHERE slug = $1', [slug]);
  return rows.length ? quoteFromRow(rows[0]) : null;
}

// Creating a quote snapshots the current catalog into the quote's items, so
// later catalog edits never change what an already-sent client link shows.
// quoteType picks which catalog categories come in - 'wedding', 'album' or
// 'both'.
export async function createQuote({ clientName, clientEmail, quoteType }) {
  const type = ['wedding', 'album', 'both'].includes(quoteType) ? quoteType : 'wedding';
  const matches = (category) =>
    type === 'both' || category === 'both' || category === type;
  const [settings, collections, addons] = await Promise.all([
    getSettings(),
    listCollections(),
    listAddons(),
  ]);
  const includedCollections = collections.filter((c) => c.active && matches(c.category));
  const includedAddons = addons.filter((a) => a.active && matches(a.category));
  const nameById = Object.fromEntries(includedCollections.map((c) => [c.id, c.name]));
  const addonItem = (a, indent) => {
    // Snapshot tier prices keyed by the collection names on THIS quote, so
    // the page can reprice the line when a collection is checked.
    const tierPrices = {};
    const includedWith = [];
    for (const [collectionId, value] of Object.entries(a.tierPrices || {})) {
      const collectionName = nameById[collectionId];
      if (!collectionName) continue;
      if (value === 'included') includedWith.push(collectionName);
      else tierPrices[collectionName] = value;
    }
    return {
      key: newId(),
      kind: 'addon',
      name: a.name,
      description: a.description,
      footnote: '',
      unitPriceCents: a.unitPriceCents,
      qty: 0,
      selected: false,
      indent: !!indent,
      featured: !!a.featured,
      tierPrices,
      includedWith,
    };
  };
  // Attached add-ons (e.g. a collection's discounted page rate) sit indented
  // directly under their collection; an attached add-on whose collection is
  // not on this quote is left off entirely.
  const items = [];
  for (const c of includedCollections) {
    items.push({
      key: newId(),
      kind: 'collection',
      name: c.name,
      description: c.includes,
      footnote: c.discounts,
      unitPriceCents: c.priceCents,
      qty: 1,
      selected: false,
    });
    for (const a of includedAddons.filter((a) => a.parentCollectionId === c.id)) {
      items.push(addonItem(a, true));
    }
  }
  for (const a of includedAddons.filter((a) => !a.parentCollectionId)) {
    items.push(addonItem(a, false));
  }
  const id = newId();
  const slug = newSlug();
  await query(
    `INSERT INTO quotes (id, slug, client_name, client_email, tax_rate, items)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, slug, clientName || '', clientEmail || '', settings.taxRate || 0, JSON.stringify(items)]
  );
  return { id, slug };
}

export async function updateQuote(id, input) {
  await query(
    `UPDATE quotes SET client_name = $2, client_email = $3, title = $4,
       tax_rate = $5, status = $6, items = $7, updated_at = now()
     WHERE id = $1 AND status != 'accepted'`,
    [
      id,
      input.clientName,
      input.clientEmail,
      input.title,
      input.taxRate,
      input.status,
      JSON.stringify(input.items),
    ]
  );
}

export async function deleteQuote(id) {
  await query('DELETE FROM quotes WHERE id = $1', [id]);
}

export async function acceptQuote(slug, { signatureName, ip, totals }) {
  const rows = await query(
    `UPDATE quotes SET status = 'accepted', signature_name = $2,
       accepted_at = now(), accepted_ip = $3, accepted_totals = $4,
       updated_at = now()
     WHERE slug = $1 AND status != 'accepted'
     RETURNING id`,
    [slug, signatureName, ip || '', JSON.stringify(totals)]
  );
  return rows.length > 0;
}
