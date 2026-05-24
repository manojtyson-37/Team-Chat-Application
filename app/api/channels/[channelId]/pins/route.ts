import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPinnedMessages } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    await requireAuth();
    const { channelId } = await params;
    const pins = await getPinnedMessages(Number(channelId));
    return NextResponse.json(pins);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
