import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-only-insecure-secret-change-me');
const COOKIE = 'bh_session';

export const hash = (pw) => bcrypt.hash(pw, 10);
export const verifyPw = (pw, h) => bcrypt.compare(pw, h);

export async function signSession(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());
}

export async function setSession(payload) {
  const token = await signSession(payload);
  cookies().set(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSession() {
  cookies().set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

/** දැන් login වෙලා ඉන්න කෙනා (හෝ null) */
export async function currentUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload; // { id, name, username, role }
  } catch { return null; }
}

/* Role එකකට මොනවා කරන්න පුළුවන්ද */
const RANK = { VIEWER: 0, CHEF: 1, STOREKEEPER: 2, MANAGER: 3, OWNER: 4 };
export const atLeast = (user, role) => !!user && (RANK[user.role] ?? -1) >= RANK[role];
export const CAN = {
  read:     (u) => atLeast(u, 'VIEWER'),
  record:   (u) => atLeast(u, 'CHEF'),        // wastage, sales, count
  stock:    (u) => atLeast(u, 'STOREKEEPER'), // GRN, transfer, items
  approve:  (u) => atLeast(u, 'MANAGER'),     // adjustments, stocktake approval
  admin:    (u) => atLeast(u, 'OWNER'),       // modules, users
};
