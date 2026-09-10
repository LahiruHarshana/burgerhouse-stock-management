'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Page, Empty, Modal, Field, api, useToast } from '@/components/ui';
import Icon from '@/components/Icon';
import { useI18n } from '@/components/I18nProvider';

const LOCATION_TYPES = ['MAIN_STORE', 'FREEZER', 'CHILLER', 'DRY_STORE', 'KITCHEN', 'BAR'];

export default function BranchesClient({ locations, role }) {
  const { t, getEnum } = useI18n();
  const r = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', type: 'MAIN_STORE', branch: 'Main' });
  const [busy, setBusy] = useState(false);
  const [toast, toastNode] = useToast();
  const canEdit = ['OWNER', 'MANAGER'].includes(role);

  const groups = locations.reduce((a, l) => { (a[l.branch] ||= []).push(l); return a; }, {});

  return (
    <Page title={t('pages.branches.title')} subtitle={t('pages.branches.subtitle')}
      action={canEdit && <button className="btn-primary" onClick={() => setOpen(true)}><Icon name="plus" size={18} /> {t('pages.branches.add')}</button>}>

      {locations.length === 0 ? (
        <Empty title={t('pages.branches.emptyTitle')} hint={t('pages.branches.emptyHint')}
          action={canEdit && <button className="btn-primary" onClick={() => setOpen(true)}>{t('pages.branches.add')}</button>} />
      ) : (
        <div className="space-y-4">
          {Object.entries(groups).map(([branch, list]) => (
            <section key={branch} className="card overflow-hidden">
              <h2 className="px-4 py-3 font-bold border-b border-line">{branch}</h2>
              <ul className="divide-y divide-line">
                {list.map((l) => (
                  <li key={l._id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-brand"><Icon name="pin" size={18} /></span>
                    <span className="font-medium flex-1">{l.name}</span>
                    <span className="hint">{getEnum('locationType', l.type)}</span>
                    {!l.active && <span className="pill-out">{t('common.inactive')}</span>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t('pages.branches.modalTitle')}>
        <div className="space-y-4">
          <Field label={t('common.name')} required hint={t('pages.branches.nameHint')}>
            <input className="field" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('common.type')}>
              <select className="field" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
                {LOCATION_TYPES.map((k) => <option key={k} value={k}>{getEnum('locationType', k)}</option>)}
              </select>
            </Field>
            <Field label={t('pages.branches.fieldBranch')}>
              <input className="field" value={f.branch} onChange={(e) => setF({ ...f, branch: e.target.value })} />
            </Field>
          </div>
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setOpen(false)}>{t('common.cancel')}</button>
            <button className="btn-primary flex-1" disabled={!f.name.trim() || busy}
              onClick={async () => { setBusy(true); try { await api('/api/locations', { method: 'POST', body: f }); setOpen(false); setF({ ...f, name: '' }); toast(t('common.added')); r.refresh(); } catch (e) { toast(e.message, 'out'); } setBusy(false); }}>
              {t('common.save')}
            </button>
          </div>
        </div>
      </Modal>
      {toastNode}
    </Page>
  );
}
