import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { listCollections, createCollection } from '@/lib/data';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await listCollections());
}

export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const id = await createCollection(body);
  return NextResponse.json({ id });
}
