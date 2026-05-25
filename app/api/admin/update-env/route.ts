import { NextRequest, NextResponse } from 'next/server';

// This endpoint is for emergency/admin use only
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'Missing token parameter' }, { status: 400 });
    }

    // This is just for testing - in production this wouldn't work
    // because env vars are set at build time, not runtime
    // But let's verify the token can be used to connect to the database

    const { createClient } = await import('@libsql/client');
    const url = process.env.TURSO_DATABASE_URL;

    if (!url) {
      return NextResponse.json({ error: 'TURSO_DATABASE_URL not set' }, { status: 500 });
    }

    const testClient = createClient({ url, authToken: token });
    const result = await testClient.execute('SELECT 1 as test');

    return NextResponse.json({
      success: true,
      message: 'Token is valid and can connect to database',
      result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 500 });
  }
}
