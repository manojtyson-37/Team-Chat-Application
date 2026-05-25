import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const url = process.env.TURSO_DATABASE_URL;
    const token = process.env.TURSO_AUTH_TOKEN;

    if (!url || !token) {
      return NextResponse.json({
        error: 'Missing environment variables',
        hasUrl: !!url,
        hasToken: !!token
      }, { status: 500 });
    }

    const { createClient } = await import('@libsql/client');
    const client = createClient({ url, authToken: token });
    const result = await client.execute('SELECT 1 as test');

    return NextResponse.json({
      success: true,
      message: 'Connected successfully',
      result
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: errorMsg,
      errorType: error instanceof Error ? error.constructor.name : typeof error
    }, { status: 500 });
  }
}
