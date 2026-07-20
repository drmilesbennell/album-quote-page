// Shared by the admin editor, the client page, and the accept endpoint so all
// three always agree on the math. All prices are integer cents.

export function lineTotalCents(item) {
  if (!item.selected) return 0;
  const qty = Number(item.qty) || 0;
  return Math.round(item.unitPriceCents * qty);
}

export function computeTotals(items, taxRate) {
  const subtotalCents = (items || []).reduce((sum, item) => sum + lineTotalCents(item), 0);
  const taxCents = Math.round(subtotalCents * ((Number(taxRate) || 0) / 100));
  return {
    subtotalCents,
    taxCents,
    totalCents: subtotalCents + taxCents,
    taxRate: Number(taxRate) || 0,
  };
}

// Brand standards §11 — displayed prices carry no dollar signs and no commas.
// Whole-dollar amounts drop the cents; amounts with cents keep two decimals.
export function formatMoney(cents) {
  const rounded = Math.round(cents);
  const dollars = rounded / 100;
  return rounded % 100 === 0 ? String(dollars) : dollars.toFixed(2);
}

// "4,900.00" (no symbol) -> cents; tolerant of "$" and commas.
export function parseMoney(text) {
  const cleaned = String(text ?? '').replace(/[$,\s]/g, '');
  if (cleaned === '') return 0;
  const value = Number(cleaned);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}
