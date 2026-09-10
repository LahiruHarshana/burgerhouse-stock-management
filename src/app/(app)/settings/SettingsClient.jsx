'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Page, Field, api, useToast } from '@/components/ui';
import Icon from '@/components/Icon';
import { MODULES, resolveEnabled, dependentsOf } from '@/lib/modules';
import { useI18n } from '@/components/I18nProvider';
import { setLocaleCookie } from '@/lib/locale';

export default function SettingsClient({ enabled, settings, locale: initialLocale }) {
  const r = useRouter();
  const { t, displayModule, moduleBlurb, setLocale } = useI18n();
  const [picked, setPicked] = useState(enabled);
  const [s, setS] = useState(settings);
  const [lang, setLang] = useState(initialLocale || 'en');
  const [busy, setBusy] = useState(false);
  const [toast, toastNode] = useToast();

  const live = resolveEnabled(picked);
  const on = (k) => live.includes(k);
  const dirty = JSON.stringify(live) !== JSON.stringify(enabled)
    || JSON.stringify(s) !== JSON.stringify(settings)
    || lang !== initialLocale;

  function toggle(m) {
    if (m.locked) return;
    setPicked((p) => {
      if (p.includes(m.key)) {
        const drop = new Set([m.key]);
        let grew = true;
        while (grew) {
          grew = false;
          for (const k of [...drop]) for (const d of dependentsOf(k)) if (!drop.has(d)) { drop.add(d); grew = true; }
        }
        return p.filter((x) => !drop.has(x));
      }
      return [...new Set([...p, ...m.requires, m.key])];
    });
  }

  async function save() {
    setBusy(true);
    try {
      if (lang !== initialLocale) {
        await api('/api/users/locale', { method: 'PUT', body: { locale: lang } });
        setLocale(lang);
        setLocaleCookie(lang);
      }
      await api('/api/settings/modules', { method: 'PUT', body: { modules: live, ...s } });
      toast(t('settings.saved'));
      r.refresh();
    } catch (e) { toast(e.message, 'out'); }
    setBusy(false);
  }

  return (
    <Page title={t('settings.title')} subtitle={t('settings.subtitle')}>
      <section className="card p-5 mb-4">
        <h2 className="font-bold text-lg mb-4">{t('settings.shopTitle')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label={t('settings.shopName')}>
            <input className="field" value={s.shopName} onChange={(e) => setS({ ...s, shopName: e.target.value })} />
          </Field>
          <Field label={t('settings.currency')}>
            <input className="field" value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })} />
          </Field>
          <Field label={t('settings.alertDays')} hint={t('settings.alertDaysHint')}>
            <input className="field num" type="number" min="1" value={s.lowStockDays}
              onChange={(e) => setS({ ...s, lowStockDays: e.target.value })} />
          </Field>
          <Field label={t('common.language')}>
            <select className="field" value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">{t('common.languageEn')}</option>
              <option value="si">{t('common.languageSi')}</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="font-bold text-lg">{t('settings.featuresTitle')}</h2>
          <p className="hint mt-1 max-w-[62ch]">{t('settings.featuresHint')}</p>
        </div>

        <ul>
          {MODULES.map((m) => {
            const active = on(m.key);
            const needs = m.requires.filter((x) => !on(x));
            const breaks = active ? dependentsOf(m.key).filter((d) => on(d)) : [];
            return (
              <li key={m.key} className="flex items-start gap-4 px-5 py-4 border-b border-line last:border-0">
                <span className={`shrink-0 w-10 h-10 rounded-card grid place-items-center
                  ${active ? 'bg-brand-light text-brand' : 'bg-wall text-muted'}`}>
                  <Icon name={m.icon} />
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{displayModule(m)}</p>
                  <p className="hint mt-0.5">{moduleBlurb(m.key)}</p>
                  {m.locked && <p className="text-[13px] text-brand font-medium mt-1">{t('settings.locked')}</p>}
                  {!active && !!needs.length && (
                    <p className="text-[13px] text-muted mt-1">
                      {t('settings.needs', { modules: needs.map((k) => displayModule(MODULES.find((x) => x.key === k))).join(', ') })}
                    </p>
                  )}
                  {!!breaks.length && (
                    <p className="text-[13px] text-low font-medium mt-1">
                      {t('settings.breaks', { modules: breaks.map((k) => displayModule(MODULES.find((x) => x.key === k))).join(', ') })}
                    </p>
                  )}
                </div>

                <button type="button" role="switch" aria-checked={active} aria-label={displayModule(m)}
                  onClick={() => toggle(m)} disabled={m.locked}
                  className={`shrink-0 w-[52px] h-8 rounded-full p-1 transition-colors
                    ${active ? 'bg-brand' : 'bg-line'} ${m.locked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <span className={`block w-6 h-6 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : ''}`} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {s.apiKey && (
        <section className="card p-5 mt-4">
          <h2 className="font-bold text-lg">{t('settings.apiTitle')}</h2>
          <p className="hint mt-1">{t('settings.apiHint')}</p>
          <code className="block mt-2 p-3 bg-wall rounded-card text-sm break-all">{s.apiKey}</code>
        </section>
      )}

      {dirty && (
        <div className="sticky bottom-0 mt-5 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-surface border-t border-line flex items-center gap-3">
          <p className="hint flex-1">{t('settings.dirty')}</p>
          <button className="btn-ghost" onClick={() => { setPicked(enabled); setS(settings); setLang(initialLocale); }}>{t('settings.revert')}</button>
          <button className="btn-primary" onClick={save} disabled={busy}>{busy ? t('settings.saving') : t('common.save')}</button>
        </div>
      )}
      {toastNode}
    </Page>
  );
}
