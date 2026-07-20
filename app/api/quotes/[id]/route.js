import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { getQuote, updateQuote, deleteQuote } from '@/lib/data';

export async function GET(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(quote);
}

export async function PUT(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const existing = await getQuote(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status === 'accepted') {
    return NextResponse.json({ error: 'Quote is accepted and locked' }, { status: 409 });
  }
  const body = await request.json();
  await updateQuote(id, {
    clientName: body.clientName ?? existing.clientName,
    clientEmail: body.clientEmail ?? existing.clientEmail,
    title: body.title ?? existing.title,
    taxRate: body.taxRate ?? existing.taxRate,
    status: body.status ?? existing.status,
    items: body.items ?? existing.items,
  });
  return NextResponse.json(await getQuote(id));
}

export async function DELETE(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  await deleteQuote(id);
  return NextResponse.json({ ok: true });
}
