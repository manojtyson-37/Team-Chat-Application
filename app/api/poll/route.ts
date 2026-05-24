import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getChannelsForUser, getUnreadCounts, getTypingUsers, updateLastSeen } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const activeChannel = req.nextUrl.searchParams.get('activeChannel');

    await updateLastSeen(session.userId);

    const channels = await getChannelsForUser(session.userId);
    const channelIds = channels.map(c => c.id);
    const unreadCounts = await getUnreadCounts(session.userId, channelIds);

    let typing: { username: string; avatar_color: string }[] = [];
    if (activeChannel) {
      typing = await getTypingUsers(parseInt(activeChannel), session.userId);
    }

    return NextResponse.json({ typing, unreadCounts, channels });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
