import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { findDmChannel, createChannel, addChannelMember, getUserById } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { userId } = await req.json();
    if (!userId || userId === session.userId) return NextResponse.json({ error: 'Invalid user' }, { status: 400 });

    const existing = await findDmChannel(session.userId, userId);
    if (existing) return NextResponse.json(existing);

    const otherUser = await getUserById(userId);
    if (!otherUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const channel = await createChannel(`dm-${session.userId}-${userId}`, session.userId, true);
    await addChannelMember(channel.id, userId);
    return NextResponse.json(channel);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
