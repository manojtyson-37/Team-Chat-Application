import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { prompt, username } = await req.json();

  if (!prompt) {
    return NextResponse.json({ reply: "You mentioned me but didn't ask anything!" });
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are a helpful assistant in a team chat between friends. Keep responses concise and conversational. The person talking to you is ${username}.`,
      messages: [{ role: 'user', content: prompt }],
    });

    const reply = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ reply: `API error: ${message}` });
  }
}
