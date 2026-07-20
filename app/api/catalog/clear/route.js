import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-helpers';
import { query, ensureSeeded } from '@/lib/db';

// Bulk catalog operations. scope: 'addons' | 'collections' | 'all'.
// reseed: true restores the built-in starter catalog after clearing all.
export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const scope = ['addons', 'collections', 'all'].includes(body.scope) ? body.scope : null;
  if (!scope) return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
  if (scope === 'addons' || scope === 'all') await query('DELETE FROM addons');
  if (scope === 'collections' || scope === 'all') await query('DELETE FROM collections');
  if (body.reseed && scope === 'all') await ensureSeeded();
  return NextResponse.json({ ok: true });
}
