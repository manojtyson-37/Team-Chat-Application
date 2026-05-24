import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getChannelsForUser, createChannel } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireAuth();
    const channels = await getChannelsForUser(session.userId);
    return NextResponse.json(channels);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const channel = await createChannel(name.toLowerCase().replace(/\s+/g, '-'), session.userId);
    return NextResponse.json(channel);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
