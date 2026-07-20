// Shared by the quote page, the admin list, and the accept endpoint so all
// three always agree on the math. All prices are integer cents.

export function selectedCollectionNames(items) {
  return (items || [])
    .filter((item) => item.kind === 'collection' && item.selected)
    .map((item) => item.name);
}

// An add-on's price follows the selected collection - a matching tier price
// wins over the a la carte price, and 'included' means no charge. With
// multiple collections selected the client gets the best applicable rate.
export function effectiveUnitPriceCents(item, selectedNames) {
  if (item.kind !== 'addon') return item.unitPriceCents;
  const names = selectedNames || [];
  if ((item.includedWith || []).some((name) => names.includes(name))) return 'included';
  const tiered = names
    .map((name) => (item.tierPrices || {})[name])
    .filter((value) => typeof value === 'number');
  if (tiered.length) return Math.min(...tiered);
  return item.unitPriceCents;
}

export function lineTotalCents(item, selectedNames) {
  if (!item.selected) return 0;
  const unit = effectiveUnitPriceCents(item, selectedNames);
  if (unit === 'included') return 0;
  const qty = Number(item.qty) || 0;
  return Math.round(unit * qty);
}

export function computeTotals(items, taxRate) {
  const names = selectedCollectionNames(items);
  const subtotalCents = (items || []).reduce(
    (sum, item) => sum + lineTotalCents(item, names),
    0
  );
  const taxCents = Math.round(subtotalCents * ((Number(taxRate) || 0) / 100));
  return {
    subtotalCents,
    taxCents,
    totalCents: subtotalCents + taxCents,
    taxRate: Number(taxRate) || 0,
  };
}

// Standard currency formatting ("$4,900.00"). The brand's no-dollar-sign rule
// applies to the website only, not to quote documents.
export function formatMoney(cents) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

// "4,900.00" (no symbol) -> cents; tolerant of "$" and commas.
export function parseMoney(text) {
  const cleaned = String(text ?? '').replace(/[$,\s]/g, '');
  if (cleaned === '') return 0;
  const value = Number(cleaned);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}
