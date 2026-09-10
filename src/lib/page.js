import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { getSettings, getUserLocale } from '@/lib/api';
import { resolveEnabled } from '@/lib/modules';

/** Off කරපු module එකක page එකකට ආවොත් මුල් පිටුවට යවනවා */
export async function requireModule(key) {
  await db();
  const user = await currentUser();
  if (!user) redirect('/login');
  const settings = await getSettings();
  const enabled = resolveEnabled(settings.enabledModules);
  if (key && !enabled.includes(key)) redirect('/');
  const locale = await getUserLocale(user.id);
  return { user, settings, enabled, locale, cur: settings.currency === 'LKR' ? 'Rs.' : settings.currency };
}
