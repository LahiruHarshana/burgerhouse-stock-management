'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Page, Empty, Modal, Field, api, useToast, StatePill } from '@/components/ui';
import ItemPicker from '@/components/ItemPicker';
import Icon from '@/components/Icon';
import { useI18n } from '@/components/I18nProvider';
import { n, money, stockState, dateTime } from '@/lib/fmt';

export default function StockClient({ locations, cur, role }) {
  const { t, displayName, getEnum } = useI18n();
  const stockLabels = { ok: t('ui.stockOk'), low: t('ui.stockLow'), out: t('ui.stockOut') };
  const sp = useSearchParams();
  const [state, setState] = useState(sp.get('state') || '');
  const [loc, setLoc] = useState('');
  const [data, setData] = useState({ rows: [], totalValue: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('levels');
  const [moves, setMoves] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, toastNode] = useToast();

  const canMove = ['OWNER', 'MANAGER', 'STOREKEEPER'].includes(role);
  const canAdjust = ['OWNER', 'MANAGER'].includes(role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (state) p.set('state', state);
      if (loc) p.set('location', loc);
      setData(await api('/api/stock?' + p));
    } catch (e) { toast(e.message, 'out'); }
    setLoading(false);
  }, [state, loc, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'moves') api('/api/stock/movements?limit=100').then((d) => setMoves(d.rows)).catch(() => {}); }, [tab]);

  return (
    <Page title={t('pages.stock.title')} subtitle={t('pages.stock.subtitle')}
      action={
        <div className="flex gap-2">
          {canMove && <button className="btn-ghost" onClick={() => setModal('transfer')}><Icon name="arrow" size={18} /> {t('pages.stock.transfer')}</button>}
          {canAdjust && <button className="btn-primary" onClick={() => setModal('adjust')}>{t('pages.stock.adjust')}</button>}
        </div>
      }>

      <div className="flex gap-2 mb-4 border-b border-line">
        {[['levels', t('pages.stock.tabLevels')], ['moves', t('pages.stock.tabMoves')]].map(([k, v]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2.5 font-semibold border-b-[3px] -mb-px ${tab === k ? 'border-brand text-brand' : 'border-transparent text-muted'}`}>
            {v}
          </button>
        ))}
      </div>

      {tab === 'levels' ? (
        <>
          <div className="card p-3 mb-4 flex flex-wrap gap-2 items-center">
            {[['', t('pages.stock.filterAll')], ['low', t('pages.stock.filterLow')], ['out', t('pages.stock.filterOut')]].map(([k, v]) => (
              <button key={k} onClick={() => setState(k)}
                className={`h-10 px-4 rounded-card font-medium ${state === k ? 'bg-brand text-white' : 'bg-wall text-ink'}`}>{v}</button>
            ))}
            {locations.length > 1 && (
              <select className="field w-auto ml-auto min-w-[160px]" value={loc} onChange={(e) => setLoc(e.target.value)}>
                <option value="">{t('pages.stock.filterAllLocs')}</option>
                {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            )}
          </div>

          <div className="card p-4 mb-4 flex items-baseline gap-3">
            <span className="hint">{t('pages.stock.totalValue')}</span>
            <span className="num text-2xl font-bold">{money(data.totalValue, cur)}</span>
          </div>

          {loading ? <div className="card p-10 text-center hint">{t('common.loading')}</div>
            : data.rows.length === 0 ? <Empty title={t('pages.stock.emptyTitle')} hint={t('pages.stock.emptyHint')} />
            : (
              <div className="card overflow-x-auto">
                <table className="w-full min-w-[620px]">
                  <thead><tr>
                    <th className="th">{t('pages.stock.colItem')}</th><th className="th text-right">{t('pages.stock.colOnHand')}</th>
                    <th className="th text-right">{t('pages.stock.colMin')}</th><th className="th">{t('pages.stock.colStatus')}</th><th className="th text-right">{t('pages.stock.colValue')}</th>
                  </tr></thead>
                  <tbody>
                    {data.rows.map((r) => (
                      <tr key={r._id}>
                        <td className="td">
                          <span className="font-medium">{displayName(r)}</span>
                          <span className="hint block text-[13px] num">{r.code}</span>
                        </td>
                        <td className="td num text-right font-bold text-base">{n(r.qty)} <span className="hint font-normal text-sm">{r.unit}</span></td>
                        <td className="td num text-right hint">{r.reorderLevel ? n(r.reorderLevel) : '—'}</td>
                        <td className="td"><StatePill state={stockState(r.qty, r.reorderLevel)} labels={stockLabels} /></td>
                        <td className="td num text-right">{money(r.value, cur)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </>
      ) : (
        <div className="card overflow-x-auto">
          {moves.length === 0 ? <p className="p-10 text-center hint">{t('pages.stock.movesEmpty')}</p> : (
            <table className="w-full min-w-[640px]">
              <thead><tr>
                <th className="th">{t('common.date')}</th><th className="th">{t('common.item')}</th><th className="th">{t('common.reason')}</th>
                <th className="th text-right">{t('common.quantity')}</th><th className="th text-right">{t('pages.stock.colBalance')}</th><th className="th">{t('common.who')}</th>
              </tr></thead>
              <tbody>
                {moves.map((m) => (
                  <tr key={m._id}>
                    <td className="td hint whitespace-nowrap">{dateTime(m.at)}</td>
                    <td className="td font-medium">{m.item?.name}</td>
                    <td className="td hint">{getEnum('reason', m.reason) || m.reason}</td>
                    <td className={`td num text-right font-semibold ${m.qty > 0 ? 'text-ok' : 'text-out'}`}>
                      {m.qty > 0 ? '+' : ''}{n(m.qty)}
                    </td>
                    <td className="td num text-right">{n(m.balanceAfter)}</td>
                    <td className="td hint">{m.userName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <MoveModal kind={modal} onClose={() => setModal(null)} locations={locations}
        onDone={(msg) => { setModal(null); toast(msg); load(); }} onError={(m) => toast(m, 'out')} />
      {toastNode}
    </Page>
  );
}

function MoveModal({ kind, onClose, locations, onDone, onError }) {
  const { t, displayName } = useI18n();
  const [item, setItem] = useState(null);
  const [f, setF] = useState({ qty: '', from: '', to: '', note: '', dir: 'in' });
  const [busy, setBusy] = useState(false);
  const isTransfer = kind === 'transfer';

  async function submit() {
    setBusy(true);
    try {
      if (isTransfer) {
        await api('/api/stock/transfer', { method: 'POST', body: { item: item._id, from: f.from, to: f.to, qty: Number(f.qty), note: f.note } });
        onDone(t('pages.stock.toastTransferred'));
      } else {
        const qty = (f.dir === 'in' ? 1 : -1) * Number(f.qty);
        await api('/api/stock/adjust', { method: 'POST', body: { item: item._id, location: f.from, qty, note: f.note } });
        onDone(t('pages.stock.toastAdjusted'));
      }
      setItem(null); setF({ qty: '', from: '', to: '', note: '', dir: 'in' });
    } catch (e) { onError(e.message); }
    setBusy(false);
  }

  const valid = item && Number(f.qty) > 0 && f.from && (!isTransfer || (f.to && f.to !== f.from)) && (isTransfer || f.note.trim());

  return (
    <Modal open={!!kind} onClose={onClose} title={isTransfer ? t('pages.stock.modalTransfer') : t('pages.stock.modalAdjust')}>
      <div className="space-y-4">
        <Field label={t('pages.stock.fieldWhat')} required>
          <ItemPicker value={item} onPick={setItem} autoFocus />
          {item && <p className="mt-2 text-[15px] font-semibold text-brand">{displayName(item)} ({item.unit})</p>}
        </Field>

        {!isTransfer && (
          <Field label={t('pages.stock.fieldDirection')} required>
            <div className="grid grid-cols-2 gap-2">
              {[['in', t('pages.stock.dirIn')], ['out', t('pages.stock.dirOut')]].map(([k, v]) => (
                <button key={k} type="button" onClick={() => setF({ ...f, dir: k })}
                  className={`h-12 rounded-card font-semibold border-2 ${f.dir === k ? 'border-brand bg-brand-light text-brand' : 'border-line'}`}>{v}</button>
              ))}
            </div>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label={isTransfer ? t('pages.stock.fieldFrom') : t('pages.stock.fieldWhere')} required>
            <select className="field" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })}>
              <option value="">{t('common.select')}</option>
              {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </Field>
          {isTransfer && (
            <Field label={t('pages.stock.fieldTo')} required>
              <select className="field" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })}>
                <option value="">{t('common.select')}</option>
                {locations.filter((l) => l._id !== f.from).map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            </Field>
          )}
          {!isTransfer && (
            <Field label={t('pages.stock.fieldQty', { unit: item?.unit || '' })} required>
              <input className="field num" type="number" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} />
            </Field>
          )}
        </div>

        {isTransfer && (
          <Field label={t('pages.stock.fieldQty', { unit: item?.unit || '' })} required>
            <input className="field num" type="number" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} />
          </Field>
        )}

        <Field label={t('pages.stock.fieldReason')} required={!isTransfer} hint={t('pages.stock.fieldReasonHint')}>
          <input className="field" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder={t('pages.stock.reasonPh')} />
        </Field>

        <div className="flex gap-3 pt-1">
          <button className="btn-ghost flex-1" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary flex-1" onClick={submit} disabled={!valid || busy}>{busy ? t('common.wait') : t('common.confirm')}</button>
        </div>
      </div>
    </Modal>
  );
}
