import { NextResponse } from 'next/server';
import { getQuoteBySlug, getSettings } from '@/lib/data';
import { publicQuote, publicSettings } from '@/lib/public';

export async function GET(request, { params }) {
  const { slug } = await params;
  const quote = await getQuoteBySlug(slug);
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const settings = await getSettings();
  return NextResponse.json({
    quote: publicQuote(quote),
    settings: publicSettings(settings),
  });
}
