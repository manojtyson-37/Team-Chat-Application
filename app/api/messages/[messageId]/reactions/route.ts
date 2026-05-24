import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { addReaction, removeReaction } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const session = await requireAuth();
    const { messageId } = await params;
    const { emoji } = await req.json();
    if (!emoji) return NextResponse.json({ error: 'Emoji required' }, { status: 400 });
    await addReaction(parseInt(messageId), session.userId, emoji);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const session = await requireAuth();
    const { messageId } = await params;
    const { emoji } = await req.json();
    await removeReaction(parseInt(messageId), session.userId, emoji);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
