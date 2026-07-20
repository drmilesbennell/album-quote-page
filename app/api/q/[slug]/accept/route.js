import { NextResponse } from 'next/server';
import { getQuoteBySlug, acceptQuote } from '@/lib/data';
import { computeTotals } from '@/lib/totals';

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
  return NextResponse.json({ ok: true });
}
