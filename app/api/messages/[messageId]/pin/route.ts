import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { pinMessage, unpinMessage } from '@/lib/db';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const session = await requireAuth();
    const { messageId } = await params;
    const ok = await pinMessage(Number(messageId), session.userId);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    await requireAuth();
    const { messageId } = await params;
    const ok = await unpinMessage(Number(messageId));
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
