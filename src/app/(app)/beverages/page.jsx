import { requireModule } from '@/lib/page';
import { Item } from '@/models';
import { t, displayName, getEnum } from '@/lib/i18n';
import { n, money } from '@/lib/fmt';
import Link from 'next/link';
export const dynamic = 'force-dynamic';

export default async function BeveragesPage() {
  const { cur, locale } = await requireModule('beverage');
  const rows = await Item.aggregate([
    { $match: { active: true, 'beverage.isBeverage': true } },
    { $lookup: { from: 'stocklevels', localField: '_id', foreignField: 'item', as: 'lv' } },
    { $addFields: { qty: { $ifNull: [{ $sum: '$lv.qty' }, 0] } } },
    { $sort: { name: 1 } },
  ]);
  const value = rows.reduce((a, r) => a + r.qty * (r.costPerUnit || 0), 0);
  const deposits = rows.reduce((a, r) => a + (r.beverage?.depositValue || 0) * r.qty, 0);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-[26px] font-bold">{t(locale, 'pages.beverages.title')}</h1>
      <p className="hint mt-1 max-w-[62ch]">{t(locale, 'pages.beverages.subtitle')}</p>

      <div className="grid sm:grid-cols-3 gap-3 mt-5">
        <div className="card p-4"><p className="hint">{t(locale, 'pages.beverages.statCount')}</p><p className="num text-2xl font-bold mt-1">{rows.length}</p></div>
        <div className="card p-4"><p className="hint">{t(locale, 'pages.beverages.statValue')}</p><p className="num text-2xl font-bold mt-1">{money(value, cur)}</p></div>
        <div className="card p-4"><p className="hint">{t(locale, 'pages.beverages.statDeposits')}</p><p className="num text-2xl font-bold mt-1">{money(deposits, cur)}</p></div>
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center mt-4">
          <p className="text-lg font-semibold">{t(locale, 'pages.beverages.emptyTitle')}</p>
          <p className="hint mt-1.5">{t(locale, 'pages.beverages.emptyHint')}</p>
          <Link href="/items" className="btn-primary mt-5 inline-flex">{t(locale, 'pages.beverages.emptyCta')}</Link>
        </div>
      ) : (
        <div className="card overflow-x-auto mt-4">
          <table className="w-full min-w-[620px]">
            <thead><tr>
              <th className="th">{t(locale, 'common.name')}</th><th className="th">{t(locale, 'pages.beverages.colContainer')}</th><th className="th text-right">{t(locale, 'pages.beverages.colSize')}</th>
              <th className="th text-right">{t(locale, 'pages.beverages.colOnHand')}</th><th className="th text-right">{t(locale, 'pages.beverages.colDeposit')}</th><th className="th text-right">{t(locale, 'pages.stock.colValue')}</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  <td className="td font-medium">{displayName(r, locale)}</td>
                  <td className="td hint">{getEnum(locale, 'container', r.beverage?.container || '')}</td>
                  <td className="td num text-right hint">{r.beverage?.containerSize ? t(locale, 'pages.beverages.sizeMl', { n: n(r.beverage.containerSize) }) : '—'}</td>
                  <td className="td num text-right font-bold">{n(r.qty)} <span className="hint font-normal">{r.unit}</span></td>
                  <td className="td num text-right">{r.beverage?.depositValue ? money(r.beverage.depositValue, cur) : '—'}</td>
                  <td className="td num text-right">{money(r.qty * (r.costPerUnit || 0), cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
