import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { getSettings, getUserLocale } from '@/lib/api';
import { getAppLocale } from '@/lib/locale.server';
import { User, Item } from '@/models';
import { resolveEnabled } from '@/lib/modules';
import Shell from '@/components/Shell';
import { I18nProvider } from '@/components/I18nProvider';
import HtmlLang from '@/components/HtmlLang';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }) {
  await db();
  if ((await User.countDocuments()) === 0) redirect('/setup');

  const user = await currentUser();
  if (!user) redirect('/login');

  const settings = await getSettings();
  const enabled = resolveEnabled(settings.enabledModules);
  const locale = getAppLocale(await getUserLocale(user.id));

  let alerts = 0;
  if (enabled.includes('stock')) {
    const rows = await Item.aggregate([
      { $match: { active: true } },
      { $lookup: { from: 'stocklevels', localField: '_id', foreignField: 'item', as: 'lv' } },
      { $addFields: { qty: { $ifNull: [{ $sum: '$lv.qty' }, 0] } } },
      { $match: { $or: [{ qty: { $lte: 0 } }, { $expr: { $and: [{ $gt: ['$reorderLevel', 0] }, { $lte: ['$qty', '$reorderLevel'] }] } }] } },
      { $count: 'n' },
    ]);
    alerts = rows[0]?.n || 0;
  }

  return (
    <I18nProvider locale={locale}>
      <HtmlLang locale={locale} />
      <Shell user={user} shopName={settings.shopName} enabled={enabled} alerts={alerts}>
        {children}
      </Shell>
    </I18nProvider>
  );
}
