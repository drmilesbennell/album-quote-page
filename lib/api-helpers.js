import { NextResponse } from 'next/server';
import { isAuthenticated } from './auth';

export async function requireAdmin() {
  if (await isAuthenticated()) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
