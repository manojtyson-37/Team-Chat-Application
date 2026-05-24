import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@libsql/client';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    await client.execute({
      sql: 'UPDATE users SET password_hash = ? WHERE username = ?',
      args: [hash, username]
    });

    return NextResponse.json({ 
      success: true, 
      message: `Password reset for ${username}` 
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to reset password' 
    }, { status: 500 });
  }
}
