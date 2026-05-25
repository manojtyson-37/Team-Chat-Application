import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function GET() {
  try {
    const url = process.env.TURSO_DATABASE_URL;
    const token = process.env.TURSO_AUTH_TOKEN;

    if (!url || !token) {
      return NextResponse.json({
        success: false,
        error: 'Missing TURSO env vars',
        hasUrl: !!url,
        hasToken: !!token
      }, { status: 500 });
    }

    const client = createClient({ url, authToken: token });
    console.log(`Attempting to execute query on ${url}`);

    // Try a simple query
    const result = await client.execute('SELECT 1 as test');
    return NextResponse.json({
      success: true,
      message: 'Database connected successfully',
      result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    console.error('DB test error:', message, stack);
    return NextResponse.json({
      success: false,
      error: message,
      stack: stack.split('\n').slice(0, 3).join('\n')
    }, { status: 500 });
  }
}
