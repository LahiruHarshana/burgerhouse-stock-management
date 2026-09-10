'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MODULES, resolveEnabled } from '@/lib/modules';
import { api } from '@/components/ui';
import AuthLayout from '@/components/AuthLayout';
import Icon from '@/components/Icon';
import { useI18n } from '@/components/I18nProvider';

export default function Setup() {
  const r = useRouter();
  const { t, displayModule, moduleBlurb } = useI18n();
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ shopName: '', fullName: '', username: '', password: '' });
  const [picked, setPicked] = useState(['items', 'users', 'stock', 'purchasing']);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const on = (k) => resolveEnabled(picked).includes(k);

  function toggle(m) {
    if (m.locked) return;
    setPicked((p) => {
      const has = p.includes(m.key);
      if (has) return p.filter((x) => x !== m.key);
      return [...new Set([...p, ...m.requires, m.key])];
    });
  }

  async function finish() {
    setErr(''); setBusy(true);
    try {
      await api('/api/setup', { method: 'POST', body: { ...f, modules: resolveEnabled(picked) } });
      r.replace('/'); r.refresh();
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  return (
    <AuthLayout step={step} title={f.shopName || t('setup.step1Title')}>
      {step === 1 ? (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">{t('setup.step1Title')}</h1>
          <p className="hint mt-1.5 mb-6">{t('setup.step1Subtitle')}</p>

          <div className="space-y-4">
            <div>
              <label className="label">{t('setup.shopName')}</label>
              <input className="field" placeholder={t('setup.shopNamePh')} autoFocus
                value={f.shopName} onChange={(e) => setF({ ...f, shopName: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('setup.yourName')}</label>
              <input className="field" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">{t('common.username')}</label>
                <input className="field" autoComplete="username"
                  value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('common.password')}</label>
                <input className="field" type="password" autoComplete="new-password"
                  value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
                <p className="hint mt-1 text-[13px]">{t('setup.passwordHint')}</p>
              </div>
            </div>
          </div>

          <button className="btn-primary btn-lg w-full mt-6"
            disabled={!f.shopName.trim() || !f.username.trim() || f.password.length < 6}
            onClick={() => setStep(2)}>
            {t('setup.next')}
          </button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">{t('setup.step2Title')}</h1>
          <p className="hint mt-1.5 mb-6 max-w-[56ch]">{t('setup.step2Subtitle')}</p>

          <div className="space-y-2.5">
            {MODULES.map((m) => {
              const active = on(m.key);
              const missing = m.requires.filter((x) => !on(x));
              return (
                <button key={m.key} type="button" onClick={() => toggle(m)} disabled={m.locked}
                  className={`w-full text-left flex gap-3.5 p-4 rounded-card border-2 transition-all duration-150
                    ${active ? 'border-brand bg-brand-light shadow-sm' : 'border-line hover:border-brand/30 hover:bg-surface-raised'}
                    ${m.locked ? 'cursor-default' : ''}`}>
                  <span className={`mt-0.5 w-7 h-7 shrink-0 rounded-lg grid place-items-center transition-colors
                    ${active ? 'bg-brand text-white shadow-sm' : 'border-2 border-line bg-surface'}`}>
                    {active && <Icon name="check" size={16} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className="font-semibold block">{displayModule(m)}</span>
                    <span className="hint block mt-0.5">{moduleBlurb(m.key)}</span>
                    {m.locked && <span className="hint block mt-1 text-[13px] text-brand font-medium">{t('setup.locked')}</span>}
                    {!!missing.length && !active && (
                      <span className="hint block mt-1 text-[13px]">
                        {t('setup.needs', { modules: missing.join(', ') })}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {err && (
            <div className="flex items-start gap-2.5 mt-4 text-sm font-medium text-out bg-out-light rounded-card px-3.5 py-2.5">
              <Icon name="warn" size={18} className="shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          )}
          <div className="flex gap-3 mt-6">
            <button className="btn-ghost btn-lg" onClick={() => setStep(1)}>{t('setup.back')}</button>
            <button className="btn-primary btn-lg flex-1" onClick={finish} disabled={busy}>
              {busy ? t('setup.finishing') : t('setup.finish')}
            </button>
          </div>
        </>
      )}
    </AuthLayout>
  );
}
