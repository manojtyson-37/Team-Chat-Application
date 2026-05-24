import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getMessages, getReactionsForMessages } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const session = await requireAuth();
    const { messageId } = await params;
    const replies = await getMessages(0, undefined, parseInt(messageId));
    const messageIds = replies.map(m => m.id);
    const reactions = await getReactionsForMessages(messageIds, session.userId);

    const enriched = replies.map((msg) => ({
      ...msg,
      reactions: reactions[msg.id]
        ? Object.entries(reactions[msg.id]).map(([emoji, data]) => ({ emoji, ...data }))
        : [],
    }));
    return NextResponse.json(enriched);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
