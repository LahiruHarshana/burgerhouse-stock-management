'use client';
import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { useI18n } from './I18nProvider';
import { api } from './ui';
import { setLocaleCookie } from '@/lib/locale';

export default function LocaleSwitcher({ variant = 'auth' }) {
  const router = useRouter();
  const { locale, setLocale, t } = useI18n();
  const persist = variant === 'app' || variant === 'terminal';

  function select(next) {
    if (next === locale) return;
    setLocale(next);
    setLocaleCookie(next);
    startTransition(() => {
      void (async () => {
        if (persist) {
          try {
            await api('/api/users/locale', { method: 'PUT', body: { locale: next } });
          } catch {
            // Optimistic UI already updated; refresh will reconcile from DB.
          }
        }
        router.refresh();
      })();
    });
  }

  const base = variant === 'terminal'
    ? 'inline-flex rounded-full bg-white/10 p-0.5'
    : variant === 'auth'
      ? 'inline-flex rounded-full border border-line bg-surface p-0.5 shadow-sm'
      : 'inline-flex rounded-full bg-wall p-0.5 w-full';

  const btn = (code, label) => {
    const active = locale === code;
    const on = variant === 'terminal'
      ? (active ? 'bg-white text-brand-dark shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/10')
      : (active ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-ink hover:bg-surface');
    return (
      <button
        type="button"
        onClick={() => select(code)}
        className={`flex-1 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${on}`}
        aria-pressed={active}
      >
        {label}
      </button>
    );
  };

  return (
    <div className={base} role="group" aria-label={t('common.language')}>
      {btn('en', t('common.languageEn'))}
      {btn('si', t('common.languageSi'))}
    </div>
  );
}
