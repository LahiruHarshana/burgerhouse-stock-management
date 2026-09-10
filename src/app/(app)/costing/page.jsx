import { requireModule } from '@/lib/page';
import { Item, Recipe, Sale, Movement } from '@/models';
import { t, displayName } from '@/lib/i18n';
import { n, money } from '@/lib/fmt';
export const dynamic = 'force-dynamic';

export default async function CostingPage() {
  const { cur, enabled, settings, locale } = await requireModule('costing');
  const monthAgo = new Date(Date.now() - 30 * 86400000);

  const [valuation, cogsRows, sales, recipes] = await Promise.all([
    Item.aggregate([
      { $match: { active: true } },
      { $lookup: { from: 'stocklevels', localField: '_id', foreignField: 'item', as: 'lv' } },
      { $addFields: { qty: { $ifNull: [{ $sum: '$lv.qty' }, 0] } } },
      { $group: { _id: null, v: { $sum: { $multiply: ['$qty', { $ifNull: ['$costPerUnit', 0] }] } } } },
    ]),
    Movement.aggregate([
      { $match: { at: { $gte: monthAgo }, reason: { $in: ['SALE', 'WASTAGE'] } } },
      { $group: { _id: '$reason', c: { $sum: { $abs: { $multiply: ['$qty', '$unitCost'] } } } } },
    ]),
    enabled.includes('sales')
      ? Sale.aggregate([{ $match: { at: { $gte: monthAgo } } }, { $group: { _id: null, s: { $sum: '$total' }, c: { $sum: '$totalCost' } } }])
      : [],
    enabled.includes('recipes')
      ? Recipe.find({ active: true, kind: 'MENU' }).select('name nameSi sellPrice cachedCost yieldQty').sort({ name: 1 }).lean()
      : [],
  ]);

  const cogs = cogsRows.reduce((a, r) => a + r.c, 0);
  const wasteCost = cogsRows.find((r) => r._id === 'WASTAGE')?.c || 0;
  const rev = sales[0]?.s || 0;
  const theoretical = sales[0]?.c || 0;
  const actual = cogsRows.find((r) => r._id === 'SALE')?.c || 0;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-[26px] font-bold">{t(locale, 'pages.costing.title')}</h1>
      <p className="hint mt-1 max-w-[62ch]">
        {t(locale, 'pages.costing.methodPrefix')} {settings.costingMethod === 'FIFO' ? t(locale, 'pages.costing.methodFifo') : t(locale, 'pages.costing.methodAvg')}.
        {t(locale, 'pages.costing.methodHint')}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        <Stat label={t(locale, 'pages.costing.statStockValue')} value={money(valuation[0]?.v || 0, cur)} />
        <Stat label={t(locale, 'pages.costing.statCogs')} value={money(cogs, cur)} />
        <Stat label={t(locale, 'pages.costing.statWasteLoss')} value={money(wasteCost, cur)} tone="text-out" />
        <Stat label={t(locale, 'pages.costing.statFoodCostPct')} value={rev > 0 ? `${n((actual / rev) * 100, 1)}%` : '—'} />
      </div>

      {rev > 0 && (
        <section className="card p-5 mt-4">
          <h2 className="font-bold text-lg">{t(locale, 'pages.costing.varianceTitle')}</h2>
          <p className="hint mt-1 max-w-[62ch]">{t(locale, 'pages.costing.varianceHint')}</p>
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            <div><p className="hint">{t(locale, 'pages.costing.theoretical')}</p><p className="num text-xl font-bold">{money(theoretical, cur)}</p></div>
            <div><p className="hint">{t(locale, 'pages.costing.actual')}</p><p className="num text-xl font-bold">{money(actual, cur)}</p></div>
            <div><p className="hint">{t(locale, 'pages.costing.gap')}</p>
              <p className={`num text-xl font-bold ${actual - theoretical > 0 ? 'text-out' : 'text-ok'}`}>
                {money(actual - theoretical, cur)}
              </p></div>
          </div>
        </section>
      )}

      {recipes.length > 0 && (
        <section className="card overflow-x-auto mt-4">
          <h2 className="px-4 py-3 font-bold border-b border-line">{t(locale, 'pages.costing.marginsTitle')}</h2>
          <table className="w-full min-w-[560px]">
            <thead><tr>
              <th className="th">{t(locale, 'common.name')}</th><th className="th text-right">{t(locale, 'common.cost')}</th><th className="th text-right">{t(locale, 'pages.costing.colPrice')}</th>
              <th className="th text-right">{t(locale, 'pages.costing.colMargin')}</th><th className="th text-right">{t(locale, 'pages.recipes.cardFoodCost')}</th>
            </tr></thead>
            <tbody>
              {recipes.map((r) => {
                const c = (r.cachedCost || 0) / (r.yieldQty || 1);
                const p = r.sellPrice || 0;
                const pct = p > 0 ? (c / p) * 100 : null;
                return (
                  <tr key={r._id}>
                    <td className="td font-medium">{displayName(r, locale)}</td>
                    <td className="td num text-right">{money(c, cur)}</td>
                    <td className="td num text-right">{p ? money(p, cur) : '—'}</td>
                    <td className="td num text-right font-semibold">{p ? money(p - c, cur) : '—'}</td>
                    <td className={`td num text-right font-semibold ${pct == null ? '' : pct > 40 ? 'text-out' : pct > 32 ? 'text-low' : 'text-ok'}`}>
                      {pct == null ? '—' : `${n(pct, 1)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, tone = '' }) {
  return <div className="card p-4"><p className="hint">{label}</p><p className={`num text-2xl font-bold mt-1 ${tone}`}>{value}</p></div>;
}
