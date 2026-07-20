import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { updateCollection, deleteCollection } from '@/lib/data';

export async function PUT(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  await updateCollection(id, await request.json());
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  await deleteCollection(id);
  return NextResponse.json({ ok: true });
}
