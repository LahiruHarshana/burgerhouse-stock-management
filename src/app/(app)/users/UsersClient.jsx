'use client';
import { useEffect, useState, useCallback } from 'react';
import { Page, Modal, Field, api, useToast } from '@/components/ui';
import Icon from '@/components/Icon';
import { useI18n } from '@/components/I18nProvider';
import { dateTime } from '@/lib/fmt';

const ROLES = ['OWNER', 'MANAGER', 'STOREKEEPER', 'CHEF', 'VIEWER'];
const PERM_KEYS = {
  OWNER: 'permOwner',
  MANAGER: 'permManager',
  STOREKEEPER: 'permStorekeeper',
  CHEF: 'permChef',
  VIEWER: 'permViewer',
};

export default function UsersClient({ me }) {
  const { t, getEnum } = useI18n();
  const [d, setD] = useState({ users: [], audit: [] });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', username: '', password: '', role: 'CHEF' });
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('users');
  const [toast, toastNode] = useToast();
  const isOwner = me.role === 'OWNER';

  const load = useCallback(() => api('/api/users').then(setD).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  return (
    <Page title={t('pages.users.title')} subtitle={t('pages.users.subtitle')}
      action={isOwner && <button className="btn-primary" onClick={() => setOpen(true)}><Icon name="plus" size={18} /> {t('pages.users.add')}</button>}>

      <div className="flex gap-2 mb-4 border-b border-line">
        {[['users', t('pages.users.tabPeople')], ['audit', t('pages.users.tabAudit')]].map(([k, v]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2.5 font-semibold border-b-[3px] -mb-px ${tab === k ? 'border-brand text-brand' : 'border-transparent text-muted'}`}>{v}</button>
        ))}
      </div>

      {tab === 'users' ? (
        <div className="card divide-y divide-line">
          {d.users.map((u) => (
            <div key={u._id} className="flex items-center gap-4 p-4">
              <span className="w-10 h-10 rounded-full bg-brand-light text-brand grid place-items-center font-bold shrink-0">
                {u.name[0]?.toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{u.name} {String(u._id) === String(me.id) && <span className="hint font-normal">{t('pages.users.you')}</span>}</p>
                <p className="hint text-[13px]">@{u.username} · {t(`pages.users.${PERM_KEYS[u.role]}`)}</p>
              </div>
              {isOwner && String(u._id) !== String(me.id) ? (
                <select className="field w-auto" value={u.role}
                  onChange={async (e) => { try { await api(`/api/users/${u._id}`, { method: 'PUT', body: { role: e.target.value } }); toast(t('common.updated')); load(); } catch (x) { toast(x.message, 'out'); } }}>
                  {ROLES.map((k) => <option key={k} value={k}>{getEnum('roles', k)}</option>)}
                </select>
              ) : <span className="pill bg-wall text-muted">{getEnum('roles', u.role)}</span>}
              {!u.active && <span className="pill-out">{t('common.inactive')}</span>}
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead><tr><th className="th">{t('common.date')}</th><th className="th">{t('common.who')}</th><th className="th">{t('pages.users.colAction')}</th><th className="th">{t('pages.users.colTarget')}</th></tr></thead>
            <tbody>
              {d.audit.map((a) => (
                <tr key={a._id}>
                  <td className="td hint whitespace-nowrap">{dateTime(a.at)}</td>
                  <td className="td font-medium">{a.userName || '—'}</td>
                  <td className="td">{a.action}</td>
                  <td className="td hint">{a.entity}{a.detail?.name ? ` — ${a.detail.name}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t('pages.users.modalTitle')}>
        <div className="space-y-4">
          <Field label={t('common.name')} required><input className="field" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('common.username')} required><input className="field" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></Field>
            <Field label={t('common.password')} required hint={t('pages.users.passwordHint')}><input className="field" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
          </div>
          <Field label={t('pages.users.fieldPermissions')} required>
            <div className="space-y-2">
              {ROLES.map((k) => (
                <button key={k} type="button" onClick={() => setF({ ...f, role: k })}
                  className={`w-full text-left p-3 rounded-card border-2 ${f.role === k ? 'border-brand bg-brand-light' : 'border-line'}`}>
                  <span className="font-semibold block">{getEnum('roles', k)}</span>
                  <span className="hint block text-[13px] mt-0.5">{t(`pages.users.${PERM_KEYS[k]}`)}</span>
                </button>
              ))}
            </div>
          </Field>
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setOpen(false)}>{t('common.cancel')}</button>
            <button className="btn-primary flex-1" disabled={busy || !f.name.trim() || !f.username.trim() || f.password.length < 6}
              onClick={async () => { setBusy(true); try { await api('/api/users', { method: 'POST', body: f }); setOpen(false); setF({ name: '', username: '', password: '', role: 'CHEF' }); toast(t('common.added')); load(); } catch (e) { toast(e.message, 'out'); } setBusy(false); }}>
              {t('common.save')}
            </button>
          </div>
        </div>
      </Modal>
      {toastNode}
    </Page>
  );
}
