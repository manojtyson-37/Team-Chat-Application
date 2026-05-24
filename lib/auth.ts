import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'session';

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production-32chars!');
}

export async function createSession(userId: number, username: string) {
  const token = await new SignJWT({ sub: String(userId), username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return token;
}

export async function verifySession(): Promise<{ userId: number; username: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecret());
    return { userId: Number(payload.sub), username: payload.username as string };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAuth(): Promise<{ userId: number; username: string }> {
  const session = await verifySession();
  if (!session) throw new Error('Unauthorized');
  return session;
}
