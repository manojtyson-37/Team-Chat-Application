import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { setTyping, getTypingUsers } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const session = await requireAuth();
    const { channelId } = await params;
    await setTyping(parseInt(channelId), session.userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const session = await requireAuth();
    const { channelId } = await params;
    const typing = await getTypingUsers(parseInt(channelId), session.userId);
    return NextResponse.json(typing);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
