import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { markAsRead, getReadReceipt } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const session = await requireAuth();
    const { channelId } = await params;
    const { messageId } = await req.json();
    await markAsRead(parseInt(channelId), session.userId, messageId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const session = await requireAuth();
    const { channelId } = await params;
    const lastRead = await getReadReceipt(parseInt(channelId), session.userId);
    return NextResponse.json({ lastRead });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
