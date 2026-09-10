'use client';
import { useEffect, useState, useCallback } from 'react';
import { Page, Empty, Modal, Field, api, useToast } from '@/components/ui';
import ItemPicker from '@/components/ItemPicker';
import Icon from '@/components/Icon';
import { useI18n } from '@/components/I18nProvider';
import { n, money, date } from '@/lib/fmt';

export default function PurchasingClient({ locations, cur, role }) {
  const { t, getEnum } = useI18n();
  const [tab, setTab] = useState('grn');
  const [grns, setGrns] = useState([]);
  const [pos, setPos] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, toastNode] = useToast();
  const canEdit = ['OWNER', 'MANAGER', 'STOREKEEPER'].includes(role);

  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      api('/api/grn').catch(() => ({ grns: [] })),
      api('/api/purchase-orders').catch(() => ({ pos: [] })),
      api('/api/suppliers').catch(() => ({ suppliers: [] })),
    ]);
    setGrns(a.grns); setPos(b.pos); setSuppliers(c.suppliers);
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <Page title={t('pages.purchasing.title')} subtitle={t('pages.purchasing.subtitle')}
      action={canEdit && (
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => setModal('po')}>{t('pages.purchasing.newPo')}</button>
          <button className="btn-primary" onClick={() => setModal('grn')}><Icon name="truck" size={18} /> {t('pages.purchasing.goodsArrived')}</button>
        </div>
      )}>

      <div className="flex gap-2 mb-4 border-b border-line overflow-x-auto">
        {[['grn', t('pages.purchasing.tabGrn')], ['po', t('pages.purchasing.tabPo')], ['sup', t('pages.purchasing.tabSup')]].map(([k, v]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2.5 font-semibold border-b-[3px] -mb-px whitespace-nowrap ${tab === k ? 'border-brand text-brand' : 'border-transparent text-muted'}`}>{v}</button>
        ))}
      </div>

      {tab === 'grn' && (grns.length === 0
        ? <Empty title={t('pages.purchasing.grnEmptyTitle')} hint={t('pages.purchasing.grnEmptyHint')}
            action={canEdit && <button className="btn-primary" onClick={() => setModal('grn')}>{t('pages.purchasing.grnEmptyCta')}</button>} />
        : <Table cols={[t('pages.purchasing.colNo'), t('pages.purchasing.colDate'), t('pages.purchasing.colSupplier'), t('pages.purchasing.colInvoice'), t('pages.purchasing.colItems'), t('pages.purchasing.colTotal')]}
            rows={grns.map((g) => [g.grnNo, date(g.receivedAt), g.supplierName || '—', g.invoiceNo || '—', g.lines.length, money(g.total, cur)])} />)}

      {tab === 'po' && (pos.length === 0
        ? <Empty title={t('pages.purchasing.poEmptyTitle')} hint={t('pages.purchasing.poEmptyHint')} />
        : <Table cols={[t('pages.purchasing.colNo'), t('pages.purchasing.colDate'), t('pages.purchasing.colSupplier'), t('pages.purchasing.colStatus'), t('pages.purchasing.colTotal')]}
            rows={pos.map((p) => [p.poNo, date(p.createdAt), p.supplierName, getEnum('poStatus', p.status), money(p.total, cur)])} />)}

      {tab === 'sup' && (
        <>
          {canEdit && <button className="btn-ghost mb-3" onClick={() => setModal('sup')}><Icon name="plus" size={18} /> {t('pages.purchasing.supAdd')}</button>}
          {suppliers.length === 0
            ? <Empty title={t('pages.purchasing.supEmptyTitle')} hint={t('pages.purchasing.supEmptyHint')} />
            : <Table cols={[t('common.code'), t('common.name'), t('pages.purchasing.colPhone'), t('pages.purchasing.colTerms')]}
                rows={suppliers.map((s) => [s.code, s.name, s.phone || '—', s.paymentTermsDays ? t('pages.purchasing.termsDays', { days: s.paymentTermsDays }) : t('pages.purchasing.termsSameDay')])} />}
        </>
      )}

      {modal === 'grn' && <GRNModal locations={locations} suppliers={suppliers} cur={cur}
        onClose={() => setModal(null)} onDone={(m) => { setModal(null); toast(m); load(); }} onErr={(m) => toast(m, 'out')} />}
      {modal === 'sup' && <SupplierModal onClose={() => setModal(null)} onDone={(m) => { setModal(null); toast(m); load(); }} onErr={(m) => toast(m, 'out')} />}
      {modal === 'po' && <POModal suppliers={suppliers} locations={locations} cur={cur}
        onClose={() => setModal(null)} onDone={(m) => { setModal(null); toast(m); load(); }} onErr={(m) => toast(m, 'out')} />}
      {toastNode}
    </Page>
  );
}

function Table({ cols, rows }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px]">
        <thead><tr>{cols.map((c, i) => <th key={c} className={`th ${i >= cols.length - 1 ? 'text-right' : ''}`}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i}>{r.map((c, j) => <td key={j} className={`td ${j >= r.length - 1 ? 'text-right num' : ''}`}>{c}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function GRNModal({ locations, suppliers, cur, onClose, onDone, onErr }) {
  const { t, displayName } = useI18n();
  const [h, setH] = useState({ supplier: '', invoiceNo: '', location: locations[0]?._id || '', extraCost: '' });
  const [lines, setLines] = useState([]);
  const [busy, setBusy] = useState(false);

  const add = (it) => setLines((l) => [...l, {
    item: it._id, name: displayName(it), unit: it.unit, factor: 1,
    qty: '', price: '', batchNo: '', expiry: '', trackExpiry: it.trackExpiry,
    units: it.purchaseUnits || [],
  }]);
  const upd = (i, k, v) => setLines((l) => l.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const del = (i) => setLines((l) => l.filter((_, j) => j !== i));

  const goods = lines.reduce((a, l) => a + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);
  const total = goods + (Number(h.extraCost) || 0);

  async function save() {
    setBusy(true);
    try {
      await api('/api/grn', { method: 'POST', body: { ...h, extraCost: Number(h.extraCost) || 0,
        lines: lines.map((l) => ({ ...l, qty: Number(l.qty), price: Number(l.price), factor: Number(l.factor) || 1 })) } });
      onDone(t('pages.purchasing.grnToast'));
    } catch (e) { onErr(e.message); }
    setBusy(false);
  }

  return (
    <Modal open onClose={onClose} wide title={t('pages.purchasing.grnModal')}>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label={t('pages.purchasing.from')}>
            <select className="field" value={h.supplier} onChange={(e) => setH({ ...h, supplier: e.target.value })}>
              <option value="">{t('common.select')}</option>
              {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label={t('pages.purchasing.invoiceNo')}><input className="field" value={h.invoiceNo} onChange={(e) => setH({ ...h, invoiceNo: e.target.value })} /></Field>
          <Field label={t('pages.purchasing.toLocation')}>
            <select className="field" value={h.location} onChange={(e) => setH({ ...h, location: e.target.value })}>
              {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label={t('pages.purchasing.lines')} hint={t('pages.purchasing.linesHint')}>
          <ItemPicker onPick={add} placeholder={t('pages.purchasing.pickerPh')} />
        </Field>

        {lines.length > 0 && (
          <div className="border border-line rounded-card divide-y divide-line">
            {lines.map((l, i) => (
              <div key={i} className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold flex-1">{l.name}</span>
                  <button onClick={() => del(i)} className="text-muted hover:text-out p-1" aria-label={t('common.remove')}><Icon name="x" size={18} /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input className="field num" type="number" placeholder={t('pages.purchasing.qtyPh')} value={l.qty} onChange={(e) => upd(i, 'qty', e.target.value)} />
                  <select className="field" value={l.factor} onChange={(e) => upd(i, 'factor', e.target.value)}>
                    <option value={1}>{l.unit}</option>
                    {l.units.map((u) => <option key={u.name} value={u.factor}>{u.name} ({u.factor} {l.unit})</option>)}
                  </select>
                  <input className="field num" type="number" placeholder={t('pages.purchasing.pricePh')} value={l.price} onChange={(e) => upd(i, 'price', e.target.value)} />
                  {l.trackExpiry
                    ? <input className="field" type="date" value={l.expiry} onChange={(e) => upd(i, 'expiry', e.target.value)} />
                    : <div className="num self-center text-right pr-2 font-semibold">{money((Number(l.qty) || 0) * (Number(l.price) || 0), cur)}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 items-end">
          <Field label={t('pages.purchasing.extraCost')} hint={t('pages.purchasing.extraCostHint')}>
            <input className="field num" type="number" value={h.extraCost} onChange={(e) => setH({ ...h, extraCost: e.target.value })} />
          </Field>
          <div className="text-right">
            <p className="hint">{t('pages.purchasing.total')}</p>
            <p className="num text-2xl font-bold">{money(total, cur)}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary flex-1" onClick={save} disabled={busy || !lines.length || lines.some((l) => !(Number(l.qty) > 0))}>
            {busy ? t('common.wait') : t('pages.purchasing.submit')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SupplierModal({ onClose, onDone, onErr }) {
  const { t } = useI18n();
  const [f, setF] = useState({ name: '', code: '', phone: '', email: '', address: '', paymentTermsDays: '', leadTimeDays: 1 });
  const [busy, setBusy] = useState(false);
  return (
    <Modal open onClose={onClose} title={t('pages.purchasing.supModal')}>
      <div className="space-y-4">
        <Field label={t('common.name')} required><input className="field" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('common.code')}><input className="field num" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></Field>
          <Field label={t('pages.purchasing.colPhone')}><input className="field num" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('pages.purchasing.colTerms')}><input className="field num" type="number" value={f.paymentTermsDays} onChange={(e) => setF({ ...f, paymentTermsDays: e.target.value })} /></Field>
          <Field label={t('pages.purchasing.neededBy')}><input className="field num" type="number" value={f.leadTimeDays} onChange={(e) => setF({ ...f, leadTimeDays: e.target.value })} /></Field>
        </div>
        <Field label="Address"><input className="field" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary flex-1" disabled={!f.name.trim() || busy}
            onClick={async () => { setBusy(true); try { await api('/api/suppliers', { method: 'POST', body: f }); onDone(t('pages.purchasing.supToast')); } catch (e) { onErr(e.message); } setBusy(false); }}>
            {t('common.save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function POModal({ suppliers, locations, cur, onClose, onDone, onErr }) {
  const { t, displayName } = useI18n();
  const [h, setH] = useState({ supplier: '', location: locations[0]?._id || '', expectedDate: '', note: '' });
  const [lines, setLines] = useState([]);
  const [busy, setBusy] = useState(false);
  const total = lines.reduce((a, l) => a + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);

  return (
    <Modal open onClose={onClose} wide title={t('pages.purchasing.poModal')}>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label={t('pages.purchasing.poTo')} required>
            <select className="field" value={h.supplier} onChange={(e) => setH({ ...h, supplier: e.target.value })}>
              <option value="">{t('common.select')}</option>
              {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label={t('pages.purchasing.neededBy')}><input className="field" type="date" value={h.expectedDate} onChange={(e) => setH({ ...h, expectedDate: e.target.value })} /></Field>
          <Field label={t('pages.purchasing.forLocation')}>
            <select className="field" value={h.location} onChange={(e) => setH({ ...h, location: e.target.value })}>
              {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label={t('pages.purchasing.poItems')}>
          <ItemPicker onPick={(it) => setLines((l) => [...l, { item: it._id, name: displayName(it), unit: it.unit, qty: '', price: it.lastPurchasePrice || '' }])} />
        </Field>

        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-[1fr_90px_110px_36px] gap-2 items-center">
            <span className="font-medium truncate">{l.name}</span>
            <input className="field num" type="number" placeholder={t('common.quantity')} value={l.qty}
              onChange={(e) => setLines((x) => x.map((y, j) => j === i ? { ...y, qty: e.target.value } : y))} />
            <input className="field num" type="number" placeholder={t('pages.purchasing.pricePh')} value={l.price}
              onChange={(e) => setLines((x) => x.map((y, j) => j === i ? { ...y, price: e.target.value } : y))} />
            <button onClick={() => setLines((x) => x.filter((_, j) => j !== i))} className="text-muted hover:text-out"><Icon name="x" size={18} /></button>
          </div>
        ))}

        <p className="text-right num text-xl font-bold">{money(total, cur)}</p>
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary flex-1" disabled={!h.supplier || !lines.length || busy}
            onClick={async () => { setBusy(true); try { await api('/api/purchase-orders', { method: 'POST', body: { ...h, status: 'SENT', lines } }); onDone(t('pages.purchasing.poToast')); } catch (e) { onErr(e.message); } setBusy(false); }}>
            {t('pages.purchasing.poSubmit')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
