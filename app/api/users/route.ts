import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAllUsers } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAuth();
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
