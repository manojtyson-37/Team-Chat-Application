import { NextRequest, NextResponse } from 'next/server';
import { getMessages, addMessage } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const after = req.nextUrl.searchParams.get('after');
  const messages = await getMessages(after ? parseInt(after) : undefined);
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const { username, content } = await req.json();
  if (!username || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const message = await addMessage(username, content);

  if (content.toLowerCase().includes('@claude')) {
    const prompt = content.replace(/@claude/gi, '').trim();
    try {
      const res = await fetch(new URL('/api/claude', req.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, username }),
      });
      const data = await res.json();
      if (data.reply) {
        await addMessage('Claude', data.reply, true);
      }
    } catch {
      await addMessage('Claude', 'Sorry, I encountered an error.', true);
    }
  }

  return NextResponse.json(message);
}
