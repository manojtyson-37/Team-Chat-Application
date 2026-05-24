import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, ensureUserInGeneral } from '@/lib/db';
import { createSession } from '@/lib/auth';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#14b8a6'];

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  if (username.length < 2 || username.length > 20) return NextResponse.json({ error: 'Username must be 2-20 characters' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

  try {
    const hash = await bcrypt.hash(password, 10);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const user = await createUser(username, hash, color);
    await ensureUserInGeneral(user.id);
    await createSession(user.id, user.username);
    return NextResponse.json({ id: user.id, username: user.username, avatar_color: user.avatar_color });
  } catch {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
  }
}
