import { User } from '@/models';
import { guard, ok, badKey, body } from '@/lib/api';
import { LOCALES } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export async function PUT(req) {
  const g = await guard();
  if (g.error) return g.error;
  const b = await body(req);
  if (!LOCALES.includes(b.locale)) return badKey(g.locale, 'errors.invalidLocale');
  await User.updateOne({ _id: g.user.id }, { $set: { locale: b.locale } });
  return ok({ locale: b.locale });
}
