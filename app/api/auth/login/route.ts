import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByUsername, ensureUserInGeneral } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const user = await getUserByUsername(username);
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  await ensureUserInGeneral(user.id);
  await createSession(user.id, user.username);
  return NextResponse.json({ id: user.id, username: user.username, avatar_color: user.avatar_color });
}
