import { NextResponse } from 'next/server';
import { getQuoteBySlug, acceptQuote, getSettings } from '@/lib/data';
import {
  computeTotals,
  effectiveUnitPriceCents,
  formatMoney,
  lineTotalCents,
  selectedCollectionNames,
} from '@/lib/totals';

// Fires the accepted quote at the configured webhook (e.g. a Zapier Catch
// Hook). Failures are swallowed - the client's acceptance must never fail
// because an integration is down.
async function notifyWebhook(url, payload) {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    console.error('Accepted-quote webhook failed:', error?.message || error);
  }
}

function webhookPayload(quote, signatureName, totals, quoteUrl) {
  const names = selectedCollectionNames(quote.items);
  const chosen = quote.items
    .filter((item) => item.selected)
    .map((item) => {
      const unit = effectiveUnitPriceCents(item, names);
      return {
        name: item.name,
        quantity: Number(item.qty) || 0,
        included: unit === 'included',
        unitPrice: unit === 'included' ? 0 : unit / 100,
        lineTotal: lineTotalCents(item, names) / 100,
      };
    });
  return {
    event: 'quote.accepted',
    quoteUrl,
    clientName: quote.clientName,
    clientEmail: quote.clientEmail,
    signatureName,
    acceptedAt: new Date().toISOString(),
    taxRate: totals.taxRate,
    subtotal: totals.subtotalCents / 100,
    tax: totals.taxCents / 100,
    total: totals.totalCents / 100,
    items: chosen,
    itemsSummary: chosen
      .map((item) =>
        item.included
          ? `${item.name} - Included`
          : `${item.name} x${item.quantity} @ ${formatMoney(item.unitPrice * 100)} = ${formatMoney(item.lineTotal * 100)}`
      )
      .join('\n'),
  };
}

export async function POST(request, { params }) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const signatureName = String(body.signatureName || '').trim();
  if (!signatureName) {
    return NextResponse.json({ error: 'Please type your name to sign.' }, { status: 400 });
  }
  const quote = await getQuoteBySlug(slug);
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (quote.status === 'accepted') {
    return NextResponse.json({ error: 'This quote has already been accepted.' }, { status: 409 });
  }
  // Totals are computed server-side from the stored quote, never trusted from
  // the browser, so the recorded amount always matches what was on the page.
  const totals = computeTotals(quote.items, quote.taxRate);
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '';
  const ok = await acceptQuote(slug, { signatureName, ip, totals });
  if (!ok) {
    return NextResponse.json({ error: 'This quote has already been accepted.' }, { status: 409 });
  }

  const settings = await getSettings();
  if (settings.webhookUrl) {
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const quoteUrl = host ? `${proto}://${host}/q/${slug}` : `/q/${slug}`;
    await notifyWebhook(
      settings.webhookUrl,
      webhookPayload(quote, signatureName, totals, quoteUrl)
    );
  }

  return NextResponse.json({ ok: true });
}
