import { db } from '@/lib/db';
import { User } from '@/models';
import { verifyPw, setSession } from '@/lib/auth';
import { ok, badKey, body } from '@/lib/api';
import { DEFAULT_LOCALE } from '@/lib/i18n';
import { getLocaleCookie } from '@/lib/locale.server';


export const dynamic = 'force-dynamic';
export async function POST(req) {
  await db();
  const { username, password } = await body(req);
  const u = await User.findOne({ username: (username || '').trim().toLowerCase() });
  if (!u || !u.active || !(await verifyPw(password || '', u.passwordHash))) {
    return badKey(DEFAULT_LOCALE, 'errors.invalidCredentials', 401);
  }
  const cookieLocale = getLocaleCookie();
  if (cookieLocale && cookieLocale !== u.locale) {
    await User.updateOne({ _id: u._id }, { $set: { locale: cookieLocale } });
  }
  await setSession({ id: String(u._id), name: u.name, username: u.username, role: u.role });
  return ok({ ok: true });
}
