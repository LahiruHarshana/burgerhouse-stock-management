'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/components/ui';
import AuthLayout from '@/components/AuthLayout';
import Icon from '@/components/Icon';
import { useI18n } from '@/components/I18nProvider';

export default function Login() {
  const r = useRouter();
  const { t } = useI18n();
  const [f, setF] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/setup').then((x) => x.json()).then((d) => d.needsSetup && r.replace('/setup')).catch(() => {});
  }, [r]);

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await api('/api/auth/login', { method: 'POST', body: f }); r.replace('/'); r.refresh(); }
    catch (e) { setErr(e.message); setBusy(false); }
  }

  return (
    <AuthLayout title={t('login.title')}>
      <h1 className="text-2xl font-semibold tracking-tight">{t('login.title')}</h1>
      <p className="hint mt-1.5 mb-6">{t('login.subtitle')}</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="u">{t('common.username')}</label>
          <input id="u" className="field" autoFocus autoComplete="username"
            value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
        </div>

        <div>
          <label className="label" htmlFor="p">{t('common.password')}</label>
          <input id="p" type="password" className="field" autoComplete="current-password"
            value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </div>

        {err && (
          <div className="flex items-start gap-2.5 text-sm font-medium text-out bg-out-light rounded-card px-3.5 py-2.5">
            <Icon name="warn" size={18} className="shrink-0 mt-0.5" />
            <span>{err}</span>
          </div>
        )}

        <button className="btn-primary btn-lg w-full mt-2" disabled={busy}>
          {busy ? t('login.wait') : t('login.submit')}
        </button>
      </form>
    </AuthLayout>
  );
}
