import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { getUserById, updateLastSeen } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json(null, { status: 401 });
  const user = await getUserById(session.userId);
  if (!user) return NextResponse.json(null, { status: 401 });
  await updateLastSeen(user.id);
  return NextResponse.json(user);
}
