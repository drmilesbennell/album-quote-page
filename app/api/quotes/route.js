import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { listQuotes, createQuote } from '@/lib/data';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await listQuotes());
}

export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const { id, slug } = await createQuote(body);
  return NextResponse.json({ id, slug });
}
