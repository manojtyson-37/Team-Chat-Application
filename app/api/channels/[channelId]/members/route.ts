import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getChannelMembers, getNonMembers, addChannelMember, removeChannelMember } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    await requireAuth();
    const { channelId } = await params;
    const cid = Number(channelId);
    const members = await getChannelMembers(cid);
    const nonMembers = await getNonMembers(cid);
    return NextResponse.json({ members, nonMembers });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    await requireAuth();
    const { channelId } = await params;
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
    await addChannelMember(Number(channelId), userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    await requireAuth();
    const { channelId } = await params;
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
    await removeChannelMember(Number(channelId), userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
