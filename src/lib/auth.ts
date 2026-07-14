import { SignJWT, jwtVerify } from 'jose';

export function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET || 'super-secret-jwt-key-for-dev-only-change-in-prod';
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
