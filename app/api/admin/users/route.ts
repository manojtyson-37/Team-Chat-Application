import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser } from '@/lib/db';
import { createClient } from '@libsql/client';

function getDb() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';

function checkAdmin(req: NextRequest) {
  const key = req.headers.get('x-admin-key');
  return key === ADMIN_KEY;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  const result = await db.execute('SELECT id, username, avatar_color, created_at, last_seen_at FROM users ORDER BY id');
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  if (username.length < 2) return NextResponse.json({ error: 'Username too short' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: 'Password must be 6+ chars' }, { status: 400 });

  try {
    const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#14b8a6'];
    const hash = await bcrypt.hash(password, 10);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const user = await createUser(username, hash, color);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
  }
}

export async function PUT(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { userId, password } = await req.json();
  if (!userId || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: 'Password must be 6+ chars' }, { status: 400 });

  const db = getDb();
  const hash = await bcrypt.hash(password, 10);
  await db.execute({ sql: 'UPDATE users SET password_hash = ? WHERE id = ?', args: [hash, userId] });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const db = getDb();
  await db.execute({ sql: 'DELETE FROM messages WHERE user_id = ?', args: [userId] });
  await db.execute({ sql: 'DELETE FROM reactions WHERE user_id = ?', args: [userId] });
  await db.execute({ sql: 'DELETE FROM read_receipts WHERE user_id = ?', args: [userId] });
  await db.execute({ sql: 'DELETE FROM channel_members WHERE user_id = ?', args: [userId] });
  await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [userId] });
  return NextResponse.json({ ok: true });
}
