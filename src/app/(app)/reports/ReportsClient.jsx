'use client';
import { useEffect, useState, useMemo } from 'react';
import { Page, api, useToast } from '@/components/ui';
import Icon from '@/components/Icon';
import { useI18n } from '@/components/I18nProvider';
import { n, money } from '@/lib/fmt';

const iso = (d) => d.toISOString().slice(0, 10);

const REPORT_TYPES = [
  { key: 'valuation', need: 'stock', typeKey: 'typeValuation' },
  { key: 'consumption', need: 'stock', typeKey: 'typeConsumption' },
  { key: 'dead', need: 'stock', typeKey: 'typeDead' },
  { key: 'wastage', need: 'wastage', typeKey: 'typeWastage' },
  { key: 'margin', need: 'recipes', typeKey: 'typeMargin' },
  { key: 'purchases', need: 'purchasing', typeKey: 'typePurchases' },
];

export default function ReportsClient({ cur, enabled }) {
  const { t, getEnum, locale } = useI18n();
  const ALL = useMemo(() => REPORT_TYPES.filter((r) => enabled.includes(r.need)).map((r) => {
    const base = { key: r.key, need: r.need, label: t(`pages.reports.${r.typeKey}`) };
    switch (r.key) {
      case 'valuation':
        return { ...base, cols: [t('common.code'), t('common.name'), t('common.quantity'), t('common.cost'), t('pages.stock.colValue')],
          map: (row) => [row.code, row.name, `${n(row.qty)} ${row.unit}`, money(row.costPerUnit, cur), money(row.value, cur)] };
      case 'consumption':
        return { ...base, cols: [t('common.code'), t('common.name'), t('common.quantity'), t('pages.stock.colValue')],
          map: (row) => [row.code, row.name, `${n(row.qty)} ${row.unit}`, money(row.value, cur)] };
      case 'dead':
        return { ...base, cols: [t('common.code'), t('common.name'), t('common.quantity'), t('pages.reports.colTiedUp')],
          map: (row) => [row.code, row.name, `${n(row.qty)} ${row.unit}`, money(row.value, cur)] };
      case 'wastage':
        return { ...base, cols: [t('common.name'), t('common.reason'), t('common.quantity'), t('pages.reports.colLoss')],
          map: (row) => [row.name, getEnum('waste', row.reason), `${n(row.qty)} ${row.unit}`, money(row.cost, cur)] };
      case 'margin':
        return { ...base, cols: [t('common.name'), t('pages.costing.colPrice'), t('common.cost'), t('pages.reports.colMargin'), t('pages.recipes.cardFoodCost'), t('pages.reports.colSold')],
          map: (row) => [row.name, money(row.price, cur), money(row.cost, cur), money(row.margin, cur), `${n(row.foodCostPct, 1)}%`, n(row.soldQty)] };
      case 'purchases':
        return { ...base, cols: [t('pages.purchasing.colSupplier'), t('pages.reports.colCount'), t('common.amount')],
          map: (row) => [row._id || '—', n(row.n), money(row.total, cur)] };
      default:
        return base;
    }
  }), [t, getEnum, cur, locale]);

  const [type, setType] = useState(ALL[0]?.key);
  const [from, setFrom] = useState(iso(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(iso(new Date()));
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, toastNode] = useToast();

  const rep = ALL.find((r) => r.key === type);

  useEffect(() => {
    if (!type) return;
    setLoading(true);
    api(`/api/reports/${type}?from=${from}&to=${to}`).then(setD).catch((e) => toast(e.message, 'out')).finally(() => setLoading(false));
  }, [type, from, to, toast]);

  useEffect(() => {
    if (ALL.length && !ALL.find((r) => r.key === type)) setType(ALL[0]?.key);
  }, [ALL, type]);

  function download() {
    if (!d?.rows?.length || !rep) return;
    const head = rep.cols.join(',');
    const body = d.rows.map((r) => rep.map(r).map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + head + '\n' + body], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${type}-${from}-to-${to}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  }

  if (!rep) return <Page title={t('pages.reports.title')}><p className="hint">{t('pages.reports.disabledHint')}</p></Page>;

  return (
    <Page title={t('pages.reports.title')} subtitle={t('pages.reports.subtitle')}
      action={<button className="btn-ghost" onClick={download} disabled={!d?.rows?.length}>{t('pages.reports.download')}</button>}>

      <div className="flex flex-wrap gap-2 mb-4">
        {ALL.map((r) => (
          <button key={r.key} onClick={() => setType(r.key)}
            className={`h-11 px-4 rounded-card font-semibold ${type === r.key ? 'bg-brand text-white' : 'bg-surface border border-line'}`}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="card p-3 mb-4 flex flex-wrap gap-3 items-center">
        <label className="hint">{t('pages.reports.from')}</label>
        <input className="field w-auto" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <label className="hint">{t('pages.reports.to')}</label>
        <input className="field w-auto" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {(d?.total != null || d?.revenue != null) && (
        <div className="card p-4 mb-4 flex flex-wrap gap-6">
          {d.total != null && <div><p className="hint">{t('pages.reports.total')}</p><p className="num text-2xl font-bold">{money(d.total, cur)}</p></div>}
          {d.revenue != null && <>
            <div><p className="hint">{t('pages.sales.statSales')}</p><p className="num text-2xl font-bold">{money(d.revenue, cur)}</p></div>
            <div><p className="hint">{t('pages.sales.statFoodCost')}</p><p className="num text-2xl font-bold">{n(d.overallFoodCostPct, 1)}%</p></div>
          </>}
        </div>
      )}

      {loading ? <div className="card p-10 text-center hint">{t('common.loading')}</div>
        : !d?.rows?.length ? <div className="card p-10 text-center hint">{t('pages.reports.empty')}</div>
        : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead><tr>{rep.cols.map((c, i) => <th key={c} className={`th ${i > 1 ? 'text-right' : ''}`}>{c}</th>)}</tr></thead>
              <tbody>
                {d.rows.map((r, i) => (
                  <tr key={i}>{rep.map(r).map((c, j) => <td key={j} className={`td ${j > 1 ? 'text-right num' : ''}`}>{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      {toastNode}
    </Page>
  );
}
