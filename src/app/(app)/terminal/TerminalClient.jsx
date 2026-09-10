'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { api, useToast } from '@/components/ui';
import { BillPreview } from '@/components/BillReceipt';
import { useI18n } from '@/components/I18nProvider';
import { money } from '@/lib/fmt';
import { POS_CATEGORIES, posCategoryOf } from '@/lib/pos';

export default function TerminalClient({ locations, cur, shopName, cashierName }) {
  const { t, displayName, getEnum } = useI18n();
  const [recipes, setRecipes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('ALL');
  const [cart, setCart] = useState([]);
  const [location, setLocation] = useState(locations[0]?._id || '');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [serviceType, setServiceType] = useState('TAKEAWAY');
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [toast, toastNode] = useToast();

  const load = useCallback(async () => {
    const b = await api('/api/recipes?kind=MENU');
    setRecipes(b.recipes || []);
    setLoaded(true);
  }, []);
  useEffect(() => { load().catch(() => setLoaded(true)); }, [load]);

  const cats = useMemo(() => {
    const used = new Set(recipes.map(posCategoryOf));
    return POS_CATEGORIES.filter((c) => used.has(c));
  }, [recipes]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return recipes.filter((r) => {
      if (cat !== 'ALL' && posCategoryOf(r) !== cat) return false;
      if (!s) return true;
      return displayName(r).toLowerCase().includes(s) || (r.code || '').toLowerCase().includes(s);
    });
  }, [recipes, q, cat, displayName]);

  const qtyById = useMemo(
    () => Object.fromEntries(cart.map((l) => [l.recipe, l.qty])),
    [cart],
  );
  const itemCount = cart.reduce((a, l) => a + l.qty, 0);
  const total = cart.reduce((a, l) => a + l.price * l.qty, 0);

  const add = (r) => setCart((c) => {
    const i = c.findIndex((x) => x.recipe === r._id);
    if (i >= 0) return c.map((x, j) => j === i ? { ...x, qty: x.qty + 1 } : x);
    return [...c, { recipe: r._id, name: displayName(r), price: r.sellPrice || 0, qty: 1 }];
  });
  const setQty = (i, qty) => setCart((c) => {
    if (qty < 1) return c.filter((_, j) => j !== i);
    return c.map((x, j) => j === i ? { ...x, qty } : x);
  });

  async function charge() {
    if (!cart.length || busy) return;
    if (!location) { toast(t('errors.noStockLocation'), 'out'); return; }
    setBusy(true);
    try {
      const res = await api('/api/sales', {
        method: 'POST',
        body: { lines: cart, location, source: 'TERMINAL', paymentMethod, serviceType },
      });
      setTicket(res.sale);
    } catch (e) { toast(e.message, 'out'); }
    setBusy(false);
  }

  function newOrder() {
    setTicket(null);
    setCart([]);
  }

  return (
    <div className="h-[calc(100dvh-3.5rem)] flex flex-col lg:flex-row min-h-0 bg-[#E8EEEA]">
      <section className="flex-1 min-w-0 min-h-0 flex flex-col">
        <div className="shrink-0 px-3 pt-3 sm:px-4 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-0.5 px-0.5">
            <CatChip active={cat === 'ALL'} onClick={() => setCat('ALL')}>{t('pages.terminal.catAll')}</CatChip>
            {cats.map((c) => (
              <CatChip key={c} active={cat === c} onClick={() => setCat(c)}>{getEnum('posCategory', c)}</CatChip>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              <Icon name="search" size={18} />
            </span>
            <input
              className="field pl-10 h-12 bg-white shadow-sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('pages.terminal.searchPh')}
              aria-label={t('pages.terminal.search')}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
          {!loaded ? (
            <p className="hint p-6 text-center">{t('common.loading')}</p>
          ) : recipes.length === 0 ? (
            <p className="hint p-6 text-center">{t('pages.terminal.noRecipes')}</p>
          ) : filtered.length === 0 ? (
            <p className="hint p-6 text-center">{t('pages.terminal.noMatch')}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((r) => {
                const qty = qtyById[r._id] || 0;
                return (
                  <button
                    key={r._id}
                    type="button"
                    onClick={() => add(r)}
                    className={`relative text-left rounded-xl p-4 min-h-[132px] flex flex-col border-2 shadow-sm transition-colors
                      ${qty
                        ? 'border-brand bg-brand-light'
                        : 'border-transparent bg-white hover:border-brand/40 active:bg-brand-light'}`}
                  >
                    {qty > 0 && (
                      <span className="absolute top-2 right-2 num min-w-[1.75rem] h-7 px-1.5 rounded-full bg-brand text-white text-sm font-bold grid place-items-center">
                        {qty}
                      </span>
                    )}
                    <p className="font-semibold text-[16px] leading-snug pr-8">{displayName(r)}</p>
                    <p className="num mt-auto pt-3 text-xl font-bold text-brand-dark">{money(r.sellPrice, cur)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <aside className="lg:w-[400px] shrink-0 flex flex-col min-h-0 max-h-[50vh] lg:max-h-none bg-brand-dark text-white">
        <div className="p-4 border-b border-white/10 shrink-0">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-semibold text-lg tracking-tight">{t('pages.terminal.cart')}</h2>
            <span className="text-white/60 text-sm">{cashierName}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {['TAKEAWAY', 'DINE_IN'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setServiceType(s)}
                className={`h-11 rounded-lg text-sm font-semibold transition-colors
                  ${serviceType === s ? 'bg-white text-brand-dark' : 'bg-white/10 text-white/80 hover:bg-white/15'}`}
              >
                {getEnum('serviceType', s)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-white/50 p-6 text-center text-sm">{t('pages.terminal.cartEmpty')}</p>
          ) : (
            <ul>
              {cart.map((l, i) => (
                <li key={l.recipe} className="px-4 py-3 border-b border-white/10">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug">{l.name}</p>
                    <button type="button" onClick={() => setQty(i, 0)} className="text-white/40 hover:text-white p-1 -mr-1" aria-label={t('common.remove')}>
                      <Icon name="x" size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button type="button" className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 font-bold text-lg" aria-label={t('pages.terminal.qtyDown')} onClick={() => setQty(i, l.qty - 1)}>−</button>
                    <span className="num w-8 text-center font-bold text-lg">{l.qty}</span>
                    <button type="button" className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 font-bold text-lg" aria-label={t('pages.terminal.qtyUp')} onClick={() => setQty(i, l.qty + 1)}>+</button>
                    <span className="num ml-auto font-semibold">{money(l.price * l.qty, cur)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-white/10 shrink-0 space-y-3">
          {locations.length > 1 && (
            <select
              className="w-full h-10 px-3 rounded-lg bg-white/10 border-0 text-sm text-white"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              aria-label={t('pages.terminal.location')}
            >
              {locations.map((l) => (
                <option key={l._id} value={l._id} className="text-ink">{l.name}</option>
              ))}
            </select>
          )}
          <div className="flex items-baseline justify-between">
            <span className="text-white/60 text-sm">{t('pages.terminal.itemsCount', { count: itemCount })}</span>
            <span className="num text-2xl font-bold">{money(total, cur)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['CASH', 'CARD'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className={`h-12 rounded-lg font-semibold transition-colors
                  ${paymentMethod === m ? 'bg-white text-brand-dark' : 'bg-white/10 text-white/80 hover:bg-white/15'}`}
              >
                {getEnum('payment', m)}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="w-full h-14 rounded-xl bg-[#E8B84A] text-brand-dark text-lg font-bold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-px"
            onClick={charge}
            disabled={!cart.length || busy || !location}
          >
            {busy ? t('common.wait') : `${t('pages.terminal.charge')}  ${money(total, cur)}`}
          </button>
          {cart.length > 0 && (
            <button type="button" className="w-full text-sm text-white/50 hover:text-white py-1" onClick={() => setCart([])}>
              {t('pages.terminal.clear')}
            </button>
          )}
        </div>
      </aside>

      {ticket && (
        <BillPreview
          sale={ticket}
          shopName={shopName}
          cur={cur}
          autoPrint
          onDone={newOrder}
        />
      )}
      {toastNode}
    </div>
  );
}

function CatChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 h-11 px-4 rounded-full text-sm font-semibold transition-colors
        ${active ? 'bg-brand text-white shadow-sm' : 'bg-white text-ink hover:bg-brand-light'}`}
    >
      {children}
    </button>
  );
}
