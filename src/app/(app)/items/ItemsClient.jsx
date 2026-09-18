'use client';
import { useEffect, useState, useCallback } from 'react';
import { Page, Empty, Modal, Field, api, useDebounced, useToast, StatePill } from '@/components/ui';
import Icon from '@/components/Icon';
import { useI18n } from '@/components/I18nProvider';
import { n, stockState } from '@/lib/fmt';
import { formatItemCost } from '@/lib/costUnit';
import CostInput from '@/components/CostInput';

const ITEM_TYPES = ['RAW', 'SEMI', 'FINISHED', 'NONFOOD'];
const CONTAINERS = ['BOTTLE', 'CAN', 'KEG', 'DRAFT'];
const UNITS = ['g', 'kg', 'ml', 'L', 'pcs', 'pack', 'bottle', 'slice'];

const blank = {
  code: '', name: '', nameSi: '', category: '', type: 'RAW', unit: 'g',
  purchaseUnits: [], yieldPct: 100, reorderLevel: '', maxLevel: '',
  defaultLocation: '', costPerUnit: '', sellPrice: '', openingQty: '',
  trackExpiry: false, perishable: false,
  beverage: { isBeverage: false, container: '', containerSize: '', depositValue: '' },
};

export default function ItemsClient({ categories, locations, enabled, cur, role }) {
  const { t, displayName, getEnum } = useI18n();
  const stockLabels = { ok: t('ui.stockOk'), low: t('ui.stockLow'), out: t('ui.stockOut') };
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const [cat, setCat] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, toastNode] = useToast();

  const canEdit = ['OWNER', 'MANAGER', 'STOREKEEPER'].includes(role);
  const hasStock = enabled.includes('stock');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '200' });
      if (dq) p.set('q', dq);
      if (cat) p.set('category', cat);
      const d = await api('/api/items?' + p);
      setRows(d.items);
    } catch (e) { toast(e.message, 'out'); }
    setLoading(false);
  }, [dq, cat, toast]);

  useEffect(() => { load(); }, [load]);

  function startNew() {
    setEditing(null);
    setF({ ...blank, defaultLocation: locations[0]?._id || '' });
    setErr(''); setOpen(true);
  }
  function startEdit(it) {
    setEditing(it);
    setF({
      ...blank, ...it,
      category: it.category?._id || it.category || '',
      defaultLocation: it.defaultLocation || '',
      beverage: { ...blank.beverage, ...(it.beverage || {}) },
      openingQty: '',
    });
    setErr(''); setOpen(true);
  }

  async function save() {
    setErr(''); setBusy(true);
    try {
      if (editing) await api(`/api/items/${editing._id}`, { method: 'PUT', body: f });
      else await api('/api/items', { method: 'POST', body: f });
      setOpen(false);
      toast(editing ? t('pages.items.toastUpdated') : t('pages.items.toastAdded', { name: f.name }));
      load();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setBev = (k, v) => setF((p) => ({ ...p, beverage: { ...p.beverage, [k]: v } }));

  return (
    <Page
      title={t('pages.items.title')}
      subtitle={t('pages.items.subtitle')}
      action={canEdit && <button className="btn-primary" onClick={startNew}><Icon name="plus" size={18} /> {t('pages.items.add')}</button>}
    >
      <div className="card p-3 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"><Icon name="search" size={18} /></span>
          <input className="field pl-10" placeholder={t('pages.items.searchPh')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="field w-auto min-w-[160px]" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">{t('pages.items.allTypes')}</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="card p-10 text-center hint">{t('common.loading')}</div>
      ) : rows.length === 0 ? (
        <Empty
          title={q || cat ? t('pages.items.searchEmptyTitle') : t('pages.items.emptyTitle')}
          hint={q || cat ? t('pages.items.searchEmptyHint') : t('pages.items.emptyHint')}
          action={canEdit && !q && <button className="btn-primary" onClick={startNew}><Icon name="plus" size={18} /> {t('pages.items.emptyCta')}</button>}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead><tr>
              <th className="th">{t('pages.items.colCode')}</th><th className="th">{t('pages.items.colName')}</th><th className="th">{t('pages.items.colCategory')}</th>
              {hasStock && <th className="th text-right">{t('pages.items.colQty')}</th>}
              {hasStock && <th className="th">{t('pages.items.colStatus')}</th>}
              <th className="th text-right">{t('pages.items.colCost')}</th>
            </tr></thead>
            <tbody>
              {rows.map((it) => (
                <tr key={it._id} className="row-tap" onClick={() => canEdit && startEdit(it)}>
                  <td className="td num text-muted">{it.code}</td>
                  <td className="td font-medium">{displayName(it)}</td>
                  <td className="td hint">{it.category?.name || getEnum('itemType', it.type)}</td>
                  {hasStock && <td className="td num text-right font-semibold">{n(it.qty)} <span className="hint font-normal">{it.unit}</span></td>}
                  {hasStock && <td className="td"><StatePill state={stockState(it.qty, it.reorderLevel)} labels={stockLabels} /></td>}
                  <td className="td num text-right whitespace-nowrap">{formatItemCost(it.costPerUnit, it.unit, cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} wide
        title={editing ? t('pages.items.editTitle', { name: displayName(editing) }) : t('pages.items.newTitle')}>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t('pages.items.colCode')} required hint={t('pages.items.fieldCodeHint')}>
              <input className="field num" value={f.code} disabled={!!editing}
                onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="BUN-01" />
            </Field>
            <Field label={t('pages.items.nameEn')} required>
              <input className="field" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Sesame Burger Bun" />
            </Field>
          </div>

          <Field label={t('pages.items.nameSi')} hint={t('pages.items.nameSiHint')}>
            <input className="field" value={f.nameSi} onChange={(e) => set('nameSi', e.target.value)} placeholder={t('pages.items.placeholderNameSi')} />
          </Field>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field label={t('pages.items.category')}>
              <select className="field" value={f.category} onChange={(e) => set('category', e.target.value)}>
                <option value="">{t('common.select')}</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label={t('pages.items.kind')}>
              <select className="field" value={f.type} onChange={(e) => set('type', e.target.value)}>
                {ITEM_TYPES.map((k) => <option key={k} value={k}>{getEnum('itemType', k)}</option>)}
              </select>
            </Field>
            <Field label={t('pages.items.unit')} required hint={t('pages.items.unitHint')}>
              <input className="field" list="units" value={f.unit} onChange={(e) => set('unit', e.target.value)} />
              <datalist id="units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
            </Field>
          </div>

          {hasStock && (
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label={t('pages.items.reorder')} hint={t('pages.items.reorderHint')}>
                <input className="field num" type="number" value={f.reorderLevel} onChange={(e) => set('reorderLevel', e.target.value)} />
              </Field>
              <Field label={t('pages.items.max')}>
                <input className="field num" type="number" value={f.maxLevel} onChange={(e) => set('maxLevel', e.target.value)} />
              </Field>
              <Field label={t('pages.items.location')}>
                <select className="field" value={f.defaultLocation} onChange={(e) => set('defaultLocation', e.target.value)}>
                  <option value="">{t('common.select')}</option>
                  {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
              </Field>
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-4">
            <CostInput
              unit={f.unit}
              value={f.costPerUnit}
              itemKey={editing?._id || 'new'}
              onChange={(v) => set('costPerUnit', v)}
            />
            <Field label={t('pages.items.yield')} hint={t('pages.items.yieldHint')}>
              <input className="field num" type="number" min="1" max="100" value={f.yieldPct} onChange={(e) => set('yieldPct', e.target.value)} />
            </Field>
            {!editing && hasStock && (
              <Field label={t('pages.items.openingQty')} hint={t('pages.items.openingHint')}>
                <input className="field num" type="number" value={f.openingQty} onChange={(e) => set('openingQty', e.target.value)} />
              </Field>
            )}
          </div>

          <div className="flex flex-wrap gap-5 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 accent-[#124734]" checked={f.trackExpiry} onChange={(e) => set('trackExpiry', e.target.checked)} />
              <span className="text-[15px]">{t('pages.items.trackExpiry')}</span>
            </label>
            {enabled.includes('beverage') && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 accent-[#124734]" checked={f.beverage.isBeverage} onChange={(e) => setBev('isBeverage', e.target.checked)} />
                <span className="text-[15px]">{t('pages.items.isBeverage')}</span>
              </label>
            )}
          </div>

          {enabled.includes('beverage') && f.beverage.isBeverage && (
            <div className="grid sm:grid-cols-3 gap-4 bg-wall/70 p-3 rounded-card">
              <Field label={t('pages.items.container')}>
                <select className="field" value={f.beverage.container} onChange={(e) => setBev('container', e.target.value)}>
                  <option value="">{t('common.select')}</option>
                  {CONTAINERS.map((k) => <option key={k} value={k}>{getEnum('container', k)}</option>)}
                </select>
              </Field>
              <Field label={t('pages.items.sizeMl')}>
                <input className="field num" type="number" value={f.beverage.containerSize} onChange={(e) => setBev('containerSize', e.target.value)} />
              </Field>
              <Field label={t('pages.items.deposit')}>
                <input className="field num" type="number" value={f.beverage.depositValue} onChange={(e) => setBev('depositValue', e.target.value)} />
              </Field>
            </div>
          )}

          {err && <p className="text-sm font-medium text-out bg-out-light rounded-card px-3 py-2">{err}</p>}

          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1" onClick={() => setOpen(false)}>{t('common.cancel')}</button>
            <button className="btn-primary flex-1" onClick={save} disabled={busy || !f.name.trim() || !f.code.trim()}>
              {busy ? t('common.wait') : t('common.save')}
            </button>
          </div>
        </div>
      </Modal>
      {toastNode}
    </Page>
  );
}
