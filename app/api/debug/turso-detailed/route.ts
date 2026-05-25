import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const url = process.env.TURSO_DATABASE_URL;
    const token = process.env.TURSO_AUTH_TOKEN;

    console.log('=== Turso Connection Debug ===');
    console.log('URL:', url);
    console.log('Token exists:', !!token);
    console.log('Token length:', token?.length);

    if (!url || !token) {
      return NextResponse.json({
        error: 'Missing environment variables',
        hasUrl: !!url,
        hasToken: !!token
      }, { status: 500 });
    }

    // Try to import and create client
    const { createClient } = await import('@libsql/client');
    console.log('Creating client...');

    const client = createClient({
      url: url,
      authToken: token
    });

    console.log('Client created, executing query...');
    const result = await client.execute('SELECT 1 as test');

    console.log('Query result:', result);
    return NextResponse.json({
      success: true,
      message: 'Connected successfully',
      result
    });
  } catch (error) {
    console.error('Full error:', error);

    const errorObj = {
      type: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      statusCode: (error as any)?.statusCode,
      details: (error as any)?.details
    };

    console.error('Error object:', JSON.stringify(errorObj, null, 2));

    return NextResponse.json({
      success: false,
      error: errorObj
    }, { status: 500 });
  }
}
