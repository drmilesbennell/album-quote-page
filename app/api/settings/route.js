import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { getSettings, saveSettings } from '@/lib/data';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await getSettings());
}

export async function PUT(request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json();
  return NextResponse.json(await saveSettings(body));
}
