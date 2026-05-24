import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { searchMessages } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const q = req.nextUrl.searchParams.get('q');
    if (!q || q.length < 2) return NextResponse.json([]);
    const results = await searchMessages(q, session.userId);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
