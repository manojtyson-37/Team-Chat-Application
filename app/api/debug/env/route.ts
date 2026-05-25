import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    turso_url: process.env.TURSO_DATABASE_URL ? '✓ SET' : '✗ MISSING',
    turso_token: process.env.TURSO_AUTH_TOKEN ? '✓ SET' : '✗ MISSING',
    jwt_secret: process.env.JWT_SECRET ? '✓ SET' : '✗ MISSING',
    node_env: process.env.NODE_ENV,
  });
}
