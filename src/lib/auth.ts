import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET || 'fallback-secret-use-env-variable-in-production';
  return new TextEncoder().encode(secret);
}

export async function signJwt(payload: any, options: { exp: string } = { exp: '7d' }) {
  const alg = 'HS256';
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(options.exp)
    .sign(getJwtSecretKey());
}

export async function verifyJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload;
  } catch (error) {
    return null;
  }
}

function getCookieValue(cookieHeader: string, name: string) {
  const match = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

async function resolveUserFromToken(token: string | undefined) {
  if (!token) return null;

  try {
    const payload = await verifyJwt(token);
    const sessionRef = payload?.sessionRef as string | undefined;
    if (!sessionRef) return null;

    const session = await prisma.deviceSession.findUnique({
      where: { refreshToken: sessionRef },
      include: {
        user: {
          include: {
            profiles: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!session?.user || !session.user.isActive) return null;

    await prisma.deviceSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    const { passwordHash, ...safeUser } = session.user;
    return safeUser;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(req: Request | NextRequest) {
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const cookieHeader = req.headers.get('cookie') || '';
  
  // Detect if this is an admin API route from the URL
  const url = req instanceof Request ? req.url : (req as NextRequest).url;
  const isAdminApiRoute = url?.includes('/api/admin/');

  const consumerToken = getCookieValue(cookieHeader, 'token');
  const adminToken = getCookieValue(cookieHeader, 'admin_token');

  // For admin API routes, ONLY use the admin token to prevent resolving the wrong user
  const token = bearerToken || (isAdminApiRoute ? adminToken : (consumerToken || adminToken));

  if (!token) return null;
  return resolveUserFromToken(token);
}

// Dedicated admin user resolver that always uses the admin_token
export async function getAdminUser(req: Request | NextRequest) {
  const cookieHeader = req.headers.get('cookie') || '';
  const adminToken = getCookieValue(cookieHeader, 'admin_token');
  if (!adminToken) return null;
  return resolveUserFromToken(adminToken);
}

// Dedicated consumer user resolver that always uses the token cookie
export async function getConsumerUser(req: Request | NextRequest) {
  const cookieHeader = req.headers.get('cookie') || '';
  const consumerToken = getCookieValue(cookieHeader, 'token');
  if (!consumerToken) return null;
  return resolveUserFromToken(consumerToken);
}