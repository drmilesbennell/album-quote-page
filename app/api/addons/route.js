import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { listAddons, createAddon } from '@/lib/data';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await listAddons());
}

export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const id = await createAddon(body);
  return NextResponse.json({ id });
}
