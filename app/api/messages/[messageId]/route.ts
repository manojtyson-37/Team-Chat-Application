import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { editMessage, deleteMessage } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const session = await requireAuth();
    const { messageId } = await params;
    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });
    const ok = await editMessage(parseInt(messageId), session.userId, content.trim());
    if (!ok) return NextResponse.json({ error: 'Not found or not yours' }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const session = await requireAuth();
    const { messageId } = await params;
    const ok = await deleteMessage(parseInt(messageId), session.userId);
    if (!ok) return NextResponse.json({ error: 'Not found or not yours' }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
