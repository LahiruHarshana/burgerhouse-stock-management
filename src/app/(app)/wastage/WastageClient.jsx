'use client';
import { useEffect, useState, useCallback } from 'react';
import { Page, Empty, Modal, Field, api, useToast } from '@/components/ui';
import ItemPicker from '@/components/ItemPicker';
import Icon from '@/components/Icon';
import { useI18n } from '@/components/I18nProvider';
import { n, money, dateTime } from '@/lib/fmt';

const WASTE_REASONS = ['EXPIRED', 'SPOILED', 'COOKING_ERROR', 'CUSTOMER_RETURN', 'SPILLAGE', 'STAFF_MEAL', 'COMPLIMENTARY', 'OTHER'];

export default function WastageClient({ locations, cur }) {
  const { t, displayName, getEnum } = useI18n();
  const [d, setD] = useState({ rows: [], byReason: [], totalCost: 0 });
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState(null);
  const [f, setF] = useState({ qty: '', reason: 'SPOILED', note: '', location: locations[0]?._id || '' });
  const [busy, setBusy] = useState(false);
  const [toast, toastNode] = useToast();

  const load = useCallback(() => api('/api/wastage').then(setD).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    setBusy(true);
    try {
      await api('/api/wastage', { method: 'POST', body: { ...f, item: item._id, qty: Number(f.qty) } });
      setOpen(false); setItem(null); setF({ ...f, qty: '', note: '' });
      toast(t('pages.wastage.toastSaved')); load();
    } catch (e) { toast(e.message, 'out'); }
    setBusy(false);
  }

  return (
    <Page title={t('pages.wastage.title')} subtitle={t('pages.wastage.subtitle')}
      action={<button className="btn-primary" onClick={() => setOpen(true)}><Icon name="plus" size={18} /> {t('pages.wastage.add')}</button>}>

      <div className="grid sm:grid-cols-4 gap-3 mb-4">
        <div className="card p-4">
          <p className="hint">{t('pages.wastage.totalLoss')}</p>
          <p className="num text-2xl font-bold text-out mt-1">{money(d.totalCost, cur)}</p>
        </div>
        {d.byReason.slice(0, 3).map((r) => (
          <div key={r._id} className="card p-4">
            <p className="hint">{getEnum('waste', r._id)}</p>
            <p className="num text-2xl font-bold mt-1">{money(r.cost, cur)}</p>
          </div>
        ))}
      </div>

      {d.rows.length === 0 ? (
        <Empty title={t('pages.wastage.emptyTitle')} hint={t('pages.wastage.emptyHint')} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead><tr>
              <th className="th">{t('common.date')}</th><th className="th">{t('common.item')}</th><th className="th">{t('common.reason')}</th>
              <th className="th text-right">{t('common.quantity')}</th><th className="th text-right">{t('pages.wastage.colLoss')}</th><th className="th">{t('common.who')}</th>
            </tr></thead>
            <tbody>
              {d.rows.map((r) => (
                <tr key={r._id}>
                  <td className="td hint whitespace-nowrap">{dateTime(r.at)}</td>
                  <td className="td font-medium">{r.item ? displayName(r.item) : r.itemName}</td>
                  <td className="td hint">{getEnum('waste', r.reason)}{r.note ? ` — ${r.note}` : ''}</td>
                  <td className="td num text-right">{n(r.qty)} {r.item?.unit}</td>
                  <td className="td num text-right text-out font-semibold">{money(r.cost, cur)}</td>
                  <td className="td hint">{r.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t('pages.wastage.modalTitle')}>
        <div className="space-y-4">
          <Field label={t('pages.wastage.fieldWhat')} required>
            <ItemPicker value={item} onPick={setItem} autoFocus />
            {item && <p className="mt-2 font-semibold text-brand">{displayName(item)} ({item.unit})</p>}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('pages.stock.fieldQty', { unit: item?.unit || '' })} required>
              <input className="field num" type="number" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} />
            </Field>
            {locations.length > 1 && (
              <Field label={t('pages.wastage.fieldWhere')}>
                <select className="field" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })}>
                  {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
              </Field>
            )}
          </div>
          <Field label={t('pages.wastage.fieldWhy')} required>
            <div className="grid grid-cols-2 gap-2">
              {WASTE_REASONS.map((k) => (
                <button key={k} type="button" onClick={() => setF({ ...f, reason: k })}
                  className={`h-11 rounded-card font-medium border-2 text-[15px] ${f.reason === k ? 'border-brand bg-brand-light text-brand' : 'border-line'}`}>{getEnum('waste', k)}</button>
              ))}
            </div>
          </Field>
          <Field label={t('pages.wastage.fieldNote')}>
            <input className="field" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          </Field>
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setOpen(false)}>{t('common.cancel')}</button>
            <button className="btn-primary flex-1" onClick={save} disabled={!item || !(Number(f.qty) > 0) || busy}>
              {busy ? t('common.wait') : t('pages.wastage.submit')}
            </button>
          </div>
        </div>
      </Modal>
      {toastNode}
    </Page>
  );
}
