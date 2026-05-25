import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getMessages, addMessage, getReactionsForMessages, getThreadReplyCount } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const session = await requireAuth();
    const { channelId } = await params;
    const after = req.nextUrl.searchParams.get('after');
    const messages = await getMessages(parseInt(channelId), after ? parseInt(after) : undefined);

    const messageIds = messages.map(m => m.id);
    const reactions = await getReactionsForMessages(messageIds, session.userId);

    const enriched = await Promise.all(messages.map(async (msg) => {
      const replyCount = await getThreadReplyCount(msg.id);
      const msgReactions = reactions[msg.id];
      return {
        ...msg,
        reply_count: replyCount,
        reactions: msgReactions
          ? Object.entries(msgReactions).map(([emoji, data]) => ({ emoji, ...data }))
          : [],
      };
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Messages endpoint error:', message);
    return NextResponse.json({ error: message || 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const session = await requireAuth();
    const { channelId } = await params;
    const { content, parentId, mediaUrl, mediaType } = await req.json();
    if (!content && !mediaUrl) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

    const message = await addMessage(
      session.userId, session.username, content || '',
      parseInt(channelId), parentId, mediaUrl, mediaType
    );
    return NextResponse.json(message);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Post message endpoint error:', message);
    return NextResponse.json({ error: message || 'Unauthorized' }, { status: 401 });
  }
}
