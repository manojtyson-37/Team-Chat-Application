import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { getUserById, updateLastSeen } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json(null, { status: 401 });
    const user = await getUserById(session.userId);
    if (!user) return NextResponse.json(null, { status: 401 });
    await updateLastSeen(user.id);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Auth/me error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}
