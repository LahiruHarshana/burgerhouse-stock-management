'use client';
import { useEffect, useState, useCallback } from 'react';
import { Page, Empty, Modal, Field, api, useToast } from '@/components/ui';
import Icon from '@/components/Icon';
import { useI18n } from '@/components/I18nProvider';
import { n, money, date } from '@/lib/fmt';

export default function StocktakeClient({ locations, categories, cur, role }) {
  const { t, getEnum } = useI18n();
  const [sheets, setSheets] = useState([]);
  const [openSheet, setOpenSheet] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [toast, toastNode] = useToast();
  const canApprove = ['OWNER', 'MANAGER'].includes(role);

  const load = useCallback(() => api('/api/stocktake').then((d) => setSheets(d.sheets)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  if (openSheet) return <Sheet id={openSheet} cur={cur} canApprove={canApprove}
    onBack={() => { setOpenSheet(null); load(); }} onToast={toast} toastNode={toastNode} />;

  return (
    <Page title={t('pages.stocktake.title')} subtitle={t('pages.stocktake.subtitle')}
      action={<button className="btn-primary" onClick={() => setNewOpen(true)}><Icon name="plus" size={18} /> {t('pages.stocktake.new')}</button>}>

      {sheets.length === 0 ? (
        <Empty title={t('pages.stocktake.emptyTitle')} hint={t('pages.stocktake.emptyHint')}
          action={<button className="btn-primary" onClick={() => setNewOpen(true)}>{t('pages.stocktake.emptyCta')}</button>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead><tr>
              <th className="th">{t('pages.purchasing.colNo')}</th><th className="th">{t('common.date')}</th><th className="th">{t('pages.stocktake.colLocation')}</th>
              <th className="th">{t('common.status')}</th><th className="th text-right">{t('common.variance')}</th>
            </tr></thead>
            <tbody>
              {sheets.map((s) => (
                <tr key={s._id} className="row-tap" onClick={() => setOpenSheet(s._id)}>
                  <td className="td num font-medium">{s.ref}</td>
                  <td className="td hint">{date(s.createdAt)}</td>
                  <td className="td">{s.locationName}</td>
                  <td className="td">
                    <span className={`pill ${s.status === 'APPROVED' ? 'pill-ok' : s.status === 'OPEN' ? 'pill-low' : 'bg-wall text-muted'}`}>{getEnum('stocktakeStatus', s.status)}</span>
                  </td>
                  <td className={`td num text-right font-semibold ${s.varianceValue < 0 ? 'text-out' : s.varianceValue > 0 ? 'text-ok' : ''}`}>
                    {money(s.varianceValue, cur)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title={t('pages.stocktake.newModalTitle')}>
        <NewSheet locations={locations} categories={categories}
          onDone={(id) => { setNewOpen(false); setOpenSheet(id); }} onErr={(m) => toast(m, 'out')} />
      </Modal>
      {toastNode}
    </Page>
  );
}

function NewSheet({ locations, categories, onDone, onErr }) {
  const { t } = useI18n();
  const [f, setF] = useState({ location: locations[0]?._id || '', category: '' });
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-4">
      <Field label={t('pages.stocktake.where')} required>
        <select className="field" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })}>
          {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
        </select>
      </Field>
      <Field label={t('pages.stocktake.category')} hint={t('pages.stocktake.categoryHint')}>
        <select className="field" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
          <option value="">{t('pages.stocktake.allItems')}</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </Field>
      <button className="btn-primary btn-lg w-full" disabled={busy}
        onClick={async () => { setBusy(true); try { const d = await api('/api/stocktake', { method: 'POST', body: f }); onDone(d.sheet._id); } catch (e) { onErr(e.message); setBusy(false); } }}>
        {busy ? t('pages.stocktake.creating') : t('pages.stocktake.createList')}
      </button>
    </div>
  );
}

function Sheet({ id, cur, canApprove, onBack, onToast, toastNode }) {
  const { t } = useI18n();
  const [sheet, setSheet] = useState(null);
  const [counts, setCounts] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/api/stocktake/${id}`).then((d) => {
      setSheet(d.sheet);
      setCounts(Object.fromEntries(d.sheet.lines.map((l) => [l._id, l.countedQty ?? ''])));
    }).catch(() => {});
  }, [id]);

  if (!sheet) return <div className="p-10 text-center hint">{t('common.loading')}</div>;

  const locked = sheet.status === 'APPROVED';
  const variance = sheet.lines.reduce((a, l) => {
    const c = counts[l._id]; if (c === '' || c == null) return a;
    return a + (Number(c) - l.systemQty) * (l.cost || 0);
  }, 0);
  const done = sheet.lines.filter((l) => counts[l._id] !== '' && counts[l._id] != null).length;

  async function save(submit) {
    setBusy(true);
    try { const d = await api(`/api/stocktake/${id}`, { method: 'PUT', body: { counts, submit } });
      setSheet({ ...sheet, status: d.status }); onToast(submit ? t('pages.stocktake.toastSubmitted') : t('pages.stocktake.toastSaved')); }
    catch (e) { onToast(e.message, 'out'); }
    setBusy(false);
  }
  async function approve() {
    if (!confirm(t('pages.stocktake.approveConfirm'))) return;
    setBusy(true);
    try { const d = await api(`/api/stocktake/${id}`, { method: 'POST' }); onToast(t('pages.stocktake.toastAdjusted', { count: d.adjusted })); onBack(); }
    catch (e) { onToast(e.message, 'out'); }
    setBusy(false);
  }

  return (
    <Page title={`${sheet.ref} — ${sheet.locationName}`} subtitle={locked ? t('pages.stocktake.lockedSubtitle') : t('pages.stocktake.openSubtitle')}
      action={<button className="btn-ghost" onClick={onBack}>{t('common.back')}</button>}>

      <div className="card p-4 mb-4 flex flex-wrap gap-6">
        <div><p className="hint">{t('pages.stocktake.counted')}</p><p className="num text-xl font-bold">{done} / {sheet.lines.length}</p></div>
        <div><p className="hint">{t('pages.stocktake.valueVariance')}</p>
          <p className={`num text-xl font-bold ${variance < 0 ? 'text-out' : variance > 0 ? 'text-ok' : ''}`}>{money(variance, cur)}</p></div>
      </div>

      <div className="card overflow-x-auto mb-4">
        <table className="w-full min-w-[560px]">
          <thead><tr>
            <th className="th">{t('common.item')}</th><th className="th text-right">{t('pages.stocktake.colSystem')}</th>
            <th className="th text-right w-32">{t('pages.stocktake.colActual')}</th><th className="th text-right">{t('pages.stocktake.colDiff')}</th>
          </tr></thead>
          <tbody>
            {sheet.lines.map((l) => {
              const c = counts[l._id];
              const diff = c === '' || c == null ? null : Number(c) - l.systemQty;
              return (
                <tr key={l._id}>
                  <td className="td"><span className="font-medium">{l.itemName}</span><span className="hint block text-[13px] num">{l.itemCode}</span></td>
                  <td className="td num text-right">{n(l.systemQty)} <span className="hint">{l.unit}</span></td>
                  <td className="td text-right">
                    <input className="field num text-right w-28" type="number" inputMode="decimal" disabled={locked}
                      value={c} onChange={(e) => setCounts({ ...counts, [l._id]: e.target.value })} />
                  </td>
                  <td className={`td num text-right font-semibold ${diff == null ? 'text-muted' : diff < 0 ? 'text-out' : diff > 0 ? 'text-ok' : ''}`}>
                    {diff == null ? '—' : `${diff > 0 ? '+' : ''}${n(diff)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!locked && (
        <div className="sticky bottom-0 bg-surface border-t border-line -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 flex gap-3">
          <button className="btn-ghost flex-1" onClick={() => save(false)} disabled={busy}>{t('common.save')}</button>
          <button className="btn-ghost flex-1" onClick={() => save(true)} disabled={busy}>{t('pages.stocktake.submit')}</button>
          {canApprove && <button className="btn-primary flex-1" onClick={approve} disabled={busy || !done}>{t('pages.stocktake.approve')}</button>}
        </div>
      )}
      {toastNode}
    </Page>
  );
}
