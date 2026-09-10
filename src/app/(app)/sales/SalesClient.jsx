'use client';
import { useEffect, useState, useCallback } from 'react';
import { Page, Empty, Modal, api, useToast } from '@/components/ui';
import Icon from '@/components/Icon';
import { useI18n } from '@/components/I18nProvider';
import { n, money, dateTime } from '@/lib/fmt';

export default function SalesClient({ locations, cur }) {
  const { t, displayName } = useI18n();
  const [d, setD] = useState({ rows: [], totals: { sales: 0, cost: 0 } });
  const [recipes, setRecipes] = useState([]);
  const [cart, setCart] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, toastNode] = useToast();

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([api('/api/sales'), api('/api/recipes?kind=MENU')]);
    setD(a); setRecipes(b.recipes);
  }, []);
  useEffect(() => { load().catch(() => {}); }, [load]);

  const add = (r) => setCart((c) => {
    const i = c.findIndex((x) => x.recipe === r._id);
    if (i >= 0) return c.map((x, j) => j === i ? { ...x, qty: x.qty + 1 } : x);
    return [...c, { recipe: r._id, name: displayName(r), price: r.sellPrice || 0, qty: 1 }];
  });
  const total = cart.reduce((a, l) => a + l.price * l.qty, 0);
  const pct = d.totals.sales > 0 ? (d.totals.cost / d.totals.sales) * 100 : null;

  async function submit() {
    setBusy(true);
    try {
      await api('/api/sales', { method: 'POST', body: { lines: cart, location: locations[0]?._id } });
      setCart([]); setOpen(false); toast(t('pages.sales.toastSaved')); load();
    } catch (e) { toast(e.message, 'out'); }
    setBusy(false);
  }

  return (
    <Page title={t('pages.sales.title')} subtitle={t('pages.sales.subtitle')}
      action={<button className="btn-primary" onClick={() => setOpen(true)}><Icon name="plus" size={18} /> {t('pages.sales.add')}</button>}>

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <div className="card p-4"><p className="hint">{t('pages.sales.statSales')}</p><p className="num text-2xl font-bold mt-1">{money(d.totals.sales, cur)}</p></div>
        <div className="card p-4"><p className="hint">{t('pages.sales.statCost')}</p><p className="num text-2xl font-bold mt-1">{money(d.totals.cost, cur)}</p></div>
        <div className="card p-4"><p className="hint">{t('pages.sales.statFoodCost')}</p>
          <p className={`num text-2xl font-bold mt-1 ${pct == null ? '' : pct > 40 ? 'text-out' : pct > 32 ? 'text-low' : 'text-ok'}`}>
            {pct == null ? '—' : `${n(pct, 1)}%`}</p></div>
      </div>

      {d.rows.length === 0 ? (
        <Empty title={t('pages.sales.emptyTitle')} hint={t('pages.sales.emptyHint')} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead><tr><th className="th">{t('pages.sales.colNo')}</th><th className="th">{t('common.date')}</th><th className="th">{t('pages.sales.colItems')}</th>
              <th className="th text-right">{t('pages.sales.colAmount')}</th><th className="th text-right">{t('common.cost')}</th></tr></thead>
            <tbody>
              {d.rows.map((s) => (
                <tr key={s._id}>
                  <td className="td num">{s.ref}</td>
                  <td className="td hint whitespace-nowrap">{dateTime(s.at)}</td>
                  <td className="td">{s.lines.map((l) => `${l.name} ×${l.qty}`).join(', ')}</td>
                  <td className="td num text-right font-semibold">{money(s.total, cur)}</td>
                  <td className="td num text-right hint">{money(s.totalCost, cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} wide title={t('pages.sales.modalTitle')}>
        {recipes.length === 0 ? (
          <p className="hint">{t('pages.sales.modalNoRecipes')}</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {recipes.map((r) => (
                <button key={r._id} onClick={() => add(r)}
                  className="card p-3 text-left hover:border-brand active:bg-brand-light">
                  <p className="font-semibold leading-snug">{displayName(r)}</p>
                  <p className="num hint mt-1">{money(r.sellPrice, cur)}</p>
                </button>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="border border-line rounded-card divide-y divide-line">
                {cart.map((l, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <span className="flex-1 font-medium">{l.name}</span>
                    <button className="btn-ghost w-10 h-10 p-0" onClick={() => setCart((c) => c.map((x, j) => j === i ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}>−</button>
                    <span className="num w-8 text-center font-bold">{l.qty}</span>
                    <button className="btn-ghost w-10 h-10 p-0" onClick={() => setCart((c) => c.map((x, j) => j === i ? { ...x, qty: x.qty + 1 } : x))}>+</button>
                    <span className="num w-24 text-right font-semibold">{money(l.price * l.qty, cur)}</span>
                    <button onClick={() => setCart((c) => c.filter((_, j) => j !== i))} className="text-muted hover:text-out"><Icon name="x" size={18} /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="hint flex-1">{t('pages.sales.cartTotal')}</span>
              <span className="num text-2xl font-bold">{money(total, cur)}</span>
            </div>
            <button className="btn-primary btn-lg w-full" onClick={submit} disabled={!cart.length || busy}>
              {busy ? t('common.wait') : t('pages.sales.submit')}
            </button>
          </div>
        )}
      </Modal>
      {toastNode}
    </Page>
  );
}
