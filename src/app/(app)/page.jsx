import Link from 'next/link';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { getSettings, getUserLocale } from '@/lib/api';
import { Item, Batch, Wastage, Sale, StockLevel } from '@/models';
import { resolveEnabled, MODULE_MAP } from '@/lib/modules';
import { t, displayName, displayModule } from '@/lib/i18n';
import Icon from '@/components/Icon';
import { n, money, daysLeft } from '@/lib/fmt';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  await db();
  const user = await currentUser();
  const locale = await getUserLocale(user.id);
  const settings = await getSettings();
  const enabled = resolveEnabled(settings.enabledModules);
  const cur = settings.currency === 'LKR' ? 'Rs.' : settings.currency;

  const hasStock = enabled.includes('stock');
  const monthAgo = new Date(Date.now() - 30 * 86400000);

  const [itemCount, alertRows, expiring, stockValue, waste, sales] = await Promise.all([
    Item.countDocuments({ active: true }),
    hasStock ? Item.aggregate([
      { $match: { active: true } },
      { $lookup: { from: 'stocklevels', localField: '_id', foreignField: 'item', as: 'lv' } },
      { $addFields: { qty: { $ifNull: [{ $sum: '$lv.qty' }, 0] } } },
      { $match: { $or: [{ qty: { $lte: 0 } }, { $expr: { $and: [{ $gt: ['$reorderLevel', 0] }, { $lte: ['$qty', '$reorderLevel'] }] } }] } },
      { $project: { name: 1, nameSi: 1, unit: 1, qty: 1, reorderLevel: 1 } },
      { $limit: 12 },
    ]) : [],
    hasStock ? Batch.find({ qty: { $gt: 0 }, expiry: { $ne: null, $lte: new Date(Date.now() + (settings.lowStockDays || 7) * 86400000) } })
      .sort({ expiry: 1 }).limit(8).populate('item', 'name nameSi unit').lean() : [],
    hasStock ? StockLevel.aggregate([{ $group: { _id: null, v: { $sum: '$value' } } }]) : [],
    enabled.includes('wastage') ? Wastage.aggregate([{ $match: { at: { $gte: monthAgo } } }, { $group: { _id: null, c: { $sum: '$cost' } } }]) : [],
    enabled.includes('sales') ? Sale.aggregate([{ $match: { at: { $gte: monthAgo } } }, { $group: { _id: null, s: { $sum: '$total' }, c: { $sum: '$totalCost' } } }]) : [],
  ]);

  const out = alertRows.filter((r) => r.qty <= 0);
  const low = alertRows.filter((r) => r.qty > 0);
  const foodCost = sales[0]?.s > 0 ? (sales[0].c / sales[0].s) * 100 : null;

  const tiles = [
    hasStock && { key: 'out', label: t(locale, 'dashboard.out'), value: out.length, tone: 'out', href: '/stock?state=out' },
    hasStock && { key: 'low', label: t(locale, 'dashboard.low'), value: low.length, tone: 'low', href: '/stock?state=low' },
    hasStock && { key: 'exp', label: t(locale, 'dashboard.expiring'), value: expiring.length, tone: 'low', href: '/stock' },
    { key: 'items', label: t(locale, 'dashboard.items'), value: itemCount, tone: 'ok', href: '/items' },
  ].filter(Boolean);

  const toneCls = { out: 'text-out', low: 'text-low', ok: 'text-ok' };
  const accentCls = { out: 'stat-card-accent-out', low: 'stat-card-accent-low', ok: 'stat-card-accent-ok' };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t(locale, 'dashboard.greeting', { name: user.name })}</h1>
      <p className="hint mt-1.5">{t(locale, 'dashboard.subtitle')}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {tiles.map((tile) => (
          <Link key={tile.key} href={tile.href} className={`stat-card ${accentCls[tile.tone]}`}>
            <p className={`num text-[36px] leading-none font-bold ${tile.value > 0 ? toneCls[tile.tone] : 'text-muted'}`}>{tile.value}</p>
            <p className="text-sm font-medium text-muted mt-2">{tile.label}</p>
          </Link>
        ))}
      </div>

      {hasStock && (
        <div className="grid lg:grid-cols-2 gap-4 mt-6">
          <section className="card overflow-hidden">
            <h2 className="px-5 py-3.5 font-semibold border-b border-line bg-surface-raised">{t(locale, 'dashboard.orderNow')}</h2>
            {alertRows.length === 0 ? (
              <p className="p-8 hint text-center">{t(locale, 'dashboard.orderEmpty')}</p>
            ) : (
              <ul>
                {alertRows.slice(0, 8).map((r) => (
                  <li key={r._id} className="flex items-center gap-3 px-5 py-3.5 border-b border-line/80 last:border-0 hover:bg-wall/50 transition-colors">
                    <span className={`w-1.5 h-8 rounded-full shrink-0 ${r.qty <= 0 ? 'bg-out' : 'bg-low'}`} />
                    <span className="flex-1 min-w-0">
                      <span className="font-medium block truncate">{displayName(r, locale)}</span>
                      <span className="hint text-[13px]">{t(locale, 'dashboard.reorderLevel', { qty: n(r.reorderLevel), unit: r.unit })}</span>
                    </span>
                    <span className={`num font-semibold ${r.qty <= 0 ? 'text-out' : 'text-low'}`}>{n(r.qty)} {r.unit}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card overflow-hidden">
            <h2 className="px-5 py-3.5 font-semibold border-b border-line bg-surface-raised">{t(locale, 'dashboard.expiringSoon')}</h2>
            {expiring.length === 0 ? (
              <p className="p-8 hint text-center">{t(locale, 'dashboard.expiringEmpty', { days: settings.lowStockDays || 7 })}</p>
            ) : (
              <ul>
                {expiring.map((b) => {
                  const d = daysLeft(b.expiry);
                  return (
                    <li key={b._id} className="flex items-center gap-3 px-5 py-3.5 border-b border-line/80 last:border-0 hover:bg-wall/50 transition-colors">
                      <span className={`w-1.5 h-8 rounded-full shrink-0 ${d <= 1 ? 'bg-out' : 'bg-low'}`} />
                      <span className="flex-1 min-w-0">
                        <span className="font-medium block truncate">{displayName(b.item, locale)}</span>
                        <span className="hint text-[13px]">{n(b.qty)} {b.item?.unit}{b.batchNo ? ` · ${b.batchNo}` : ''}</span>
                      </span>
                      <span className={`num font-semibold ${d <= 1 ? 'text-out' : 'text-low'}`}>
                        {d <= 0 ? t(locale, 'dashboard.expired') : t(locale, 'dashboard.daysLeft', { days: d })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {(hasStock || waste.length || sales.length) && (
        <div className="grid sm:grid-cols-3 gap-3 mt-6">
          {hasStock && (
            <div className="stat-card stat-card-accent-ok">
              <p className="hint text-sm">{t(locale, 'dashboard.stockValue')}</p>
              <p className="num text-2xl font-bold mt-1.5">{money(stockValue[0]?.v || 0, cur)}</p>
            </div>
          )}
          {enabled.includes('wastage') && (
            <div className="stat-card stat-card-accent-out">
              <p className="hint text-sm">{t(locale, 'dashboard.wastage30')}</p>
              <p className="num text-2xl font-bold mt-1.5 text-out">{money(waste[0]?.c || 0, cur)}</p>
            </div>
          )}
          {enabled.includes('sales') && (
            <div className="stat-card stat-card-accent-ok">
              <p className="hint text-sm">{t(locale, 'dashboard.foodCost30')}</p>
              <p className="num text-2xl font-bold mt-1.5">{foodCost == null ? '—' : `${n(foodCost, 1)}%`}</p>
            </div>
          )}
        </div>
      )}

      <section className="mt-8">
        <h2 className="font-semibold text-lg mb-4">{t(locale, 'dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {enabled.filter((k) => k !== 'users').map((k) => MODULE_MAP[k]).map((m) => (
            <Link key={m.key} href={m.href} className="card card-hover p-4 flex items-start gap-3 group">
              <span className="w-10 h-10 rounded-full bg-brand-light text-brand grid place-items-center shrink-0 group-hover:bg-brand group-hover:text-white transition-colors">
                <Icon name={m.icon} />
              </span>
              <span className="font-semibold text-[15px] leading-snug pt-1.5">{displayModule(m, locale)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
