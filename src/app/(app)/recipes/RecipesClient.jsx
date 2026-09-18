'use client';
import { useEffect, useState, useCallback } from 'react';
import { Page, Empty, Modal, Field, api, useToast } from '@/components/ui';
import ItemPicker from '@/components/ItemPicker';
import Icon from '@/components/Icon';
import { useI18n } from '@/components/I18nProvider';
import { n, money } from '@/lib/fmt';

export default function RecipesClient({ cur, role }) {
  const { t, displayName } = useI18n();
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, toastNode] = useToast();
  const canEdit = ['OWNER', 'MANAGER', 'STOREKEEPER'].includes(role);

  const load = useCallback(() => api('/api/recipes').then((d) => setRows(d.recipes)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  return (
    <Page title={t('pages.recipes.title')} subtitle={t('pages.recipes.subtitle')}
      action={canEdit && <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}><Icon name="plus" size={18} /> {t('pages.recipes.add')}</button>}>

      {rows.length === 0 ? (
        <Empty title={t('pages.recipes.emptyTitle')} hint={t('pages.recipes.emptyHint')}
          action={canEdit && <button className="btn-primary" onClick={() => setOpen(true)}>{t('pages.recipes.emptyCta')}</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((r) => {
            const cost = (r.cachedCost || 0) / (r.yieldQty || 1);
            const pct = r.sellPrice > 0 ? (cost / r.sellPrice) * 100 : null;
            return (
              <button key={r._id} onClick={() => { setEditing(r); setOpen(true); }}
                className="card p-4 text-left hover:border-brand">
                <p className="font-semibold text-[17px]">{displayName(r)}</p>
                <p className="hint text-[13px] mt-0.5">{t('pages.recipes.cardMeta', { count: r.lines.length, kind: r.kind === 'SUB' ? t('pages.recipes.kindSub') : t('pages.recipes.kindMenu') })}</p>
                <div className="flex items-baseline gap-4 mt-3">
                  <span><span className="hint text-[13px] block">{t('pages.recipes.cardCost')}</span><span className="num font-bold">{money(cost, cur)}</span></span>
                  <span><span className="hint text-[13px] block">{t('pages.recipes.cardSell')}</span><span className="num font-bold">{r.sellPrice ? money(r.sellPrice, cur) : '—'}</span></span>
                  {pct != null && (
                    <span className="ml-auto"><span className="hint text-[13px] block">{t('pages.recipes.cardFoodCost')}</span>
                      <span className={`num font-bold ${pct > 40 ? 'text-out' : pct > 32 ? 'text-low' : 'text-ok'}`}>{n(pct, 0)}%</span></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {open && <RecipeModal recipe={editing} cur={cur} onClose={() => setOpen(false)}
        onDone={(m) => { setOpen(false); toast(m); load(); }} onErr={(m) => toast(m, 'out')} />}
      {toastNode}
    </Page>
  );
}

function RecipeModal({ recipe, cur, onClose, onDone, onErr }) {
  const { t, displayName } = useI18n();
  const [f, setF] = useState({ name: '', nameSi: '', kind: 'MENU', yieldQty: 1, sellPrice: '', posCategory: '' });
  const [lines, setLines] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(!recipe);

  useEffect(() => {
    if (!recipe) return;
    api(`/api/recipes/${recipe._id}`).then((d) => {
      setF({ name: d.recipe.name, nameSi: d.recipe.nameSi || '', kind: d.recipe.kind,
        yieldQty: d.recipe.yieldQty, sellPrice: d.recipe.sellPrice || '',
        posCategory: d.recipe.posCategory || '' });
      setLines(d.recipe.lines.filter((l) => l.item).map((l) => ({
        item: l.item._id, name: displayName(l.item), unit: l.item.unit,
        cost: l.item.costPerUnit || 0, qty: l.qty,
      })));
      setLoaded(true);
    }).catch((e) => onErr(e.message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe, onErr]);

  const cost = lines.reduce((a, l) => a + (Number(l.qty) || 0) * (l.cost || 0), 0) / (Number(f.yieldQty) || 1);
  const pct = Number(f.sellPrice) > 0 ? (cost / Number(f.sellPrice)) * 100 : null;

  async function save() {
    setBusy(true);
    try {
      const body = { ...f, lines: lines.map((l) => ({ item: l.item, qty: Number(l.qty) })) };
      if (recipe) await api(`/api/recipes/${recipe._id}`, { method: 'PUT', body });
      else await api('/api/recipes', { method: 'POST', body });
      onDone(recipe ? t('pages.recipes.toastUpdated') : t('pages.recipes.toastCreated'));
    } catch (e) { onErr(e.message); }
    setBusy(false);
  }

  if (!loaded) return <Modal open onClose={onClose} title={t('pages.recipes.modalLoading')}><p className="hint">{t('common.wait')}</p></Modal>;

  return (
    <Modal open onClose={onClose} wide title={recipe ? f.name : t('pages.recipes.modalNew')}>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('pages.recipes.fieldName')} required><input className="field" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Double Cheese Burger" /></Field>
          <Field label={t('pages.recipes.fieldNameSi')}><input className="field" value={f.nameSi} onChange={(e) => setF({ ...f, nameSi: e.target.value })} /></Field>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label={t('pages.recipes.fieldKind')}>
            <select className="field" value={f.kind} disabled={!!recipe} onChange={(e) => setF({ ...f, kind: e.target.value })}>
              <option value="MENU">{t('pages.recipes.kindMenuOpt')}</option>
              <option value="SUB">{t('pages.recipes.kindSubOpt')}</option>
            </select>
          </Field>
          <Field label={t('pages.recipes.fieldYield')} hint={t('pages.recipes.fieldYieldHint')}><input className="field num" type="number" value={f.yieldQty} onChange={(e) => setF({ ...f, yieldQty: e.target.value })} /></Field>
          <Field label={t('pages.recipes.fieldSell')}><input className="field num" type="number" value={f.sellPrice} onChange={(e) => setF({ ...f, sellPrice: e.target.value })} /></Field>
          {f.kind === 'MENU' && (
            <Field label={t('pages.recipes.fieldPosCat')} hint={t('pages.recipes.fieldPosCatHint')}>
              <select className="field" value={f.posCategory} onChange={(e) => setF({ ...f, posCategory: e.target.value })}>
                <option value="">{t('pages.recipes.posCatAuto')}</option>
                <option value="BURGERS">{t('enums.posCategory.BURGERS')}</option>
                <option value="HOT_DOGS">{t('enums.posCategory.HOT_DOGS')}</option>
                <option value="SUBMARINES">{t('enums.posCategory.SUBMARINES')}</option>
                <option value="SIDES">{t('enums.posCategory.SIDES')}</option>
                <option value="DRINKS">{t('enums.posCategory.DRINKS')}</option>
                <option value="OTHER">{t('enums.posCategory.OTHER')}</option>
              </select>
            </Field>
          )}
        </div>

        <Field label={t('pages.recipes.fieldIngredients')} required hint={t('pages.recipes.fieldIngredientsHint')}>
          <ItemPicker onPick={(it) => setLines((l) => [...l, { item: it._id, name: displayName(it), unit: it.unit, cost: it.costPerUnit || 0, qty: '' }])} />
        </Field>

        {lines.length > 0 && (
          <div className="border border-line rounded-card divide-y divide-line">
            {lines.map((l, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5">
                <span className="flex-1 min-w-0 truncate font-medium">{l.name}</span>
                <input className="field num w-24" type="number" placeholder="0" value={l.qty}
                  onChange={(e) => setLines((x) => x.map((y, j) => j === i ? { ...y, qty: e.target.value } : y))} />
                <span className="hint w-12">{l.unit}</span>
                <span className="num w-24 text-right hint">{money((Number(l.qty) || 0) * l.cost, cur)}</span>
                <button onClick={() => setLines((x) => x.filter((_, j) => j !== i))} className="text-muted hover:text-out p-1"><Icon name="x" size={18} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-wall rounded-card p-4 flex flex-wrap gap-6">
          <div><p className="hint">{t('pages.recipes.unitCost')}</p><p className="num text-xl font-bold">{money(cost, cur)}</p></div>
          <div><p className="hint">{t('pages.recipes.margin')}</p><p className="num text-xl font-bold">{f.sellPrice ? money(Number(f.sellPrice) - cost, cur) : '—'}</p></div>
          <div><p className="hint">{t('pages.recipes.cardFoodCost')}</p>
            <p className={`num text-xl font-bold ${pct == null ? '' : pct > 40 ? 'text-out' : pct > 32 ? 'text-low' : 'text-ok'}`}>
              {pct == null ? '—' : `${n(pct, 1)}%`}
            </p>
          </div>
        </div>
        {pct > 40 && <p className="text-sm text-out bg-out-light rounded-card px-3 py-2">{t('pages.recipes.warnFoodCost')}</p>}

        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary flex-1" onClick={save} disabled={busy || !f.name.trim() || !lines.length}>
            {busy ? t('common.wait') : t('common.save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
