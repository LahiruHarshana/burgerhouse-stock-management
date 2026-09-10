'use client';
import { useEffect, useState, useCallback } from 'react';
import Icon from './Icon';
import { t as translate, DEFAULT_LOCALE } from '@/lib/i18n';

export function Page({ title, subtitle, action, breadcrumb, children }) {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
      {breadcrumb && <nav className="text-sm text-muted mb-3">{breadcrumb}</nav>}
      <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="hint mt-1.5 max-w-[60ch]">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}

export function Empty({ title, hint, action, icon }) {
  return (
    <div className="card p-12 text-center">
      <div className="w-14 h-14 rounded-full bg-wall mx-auto mb-4 grid place-items-center text-muted">
        {icon || (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M4 7h16M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
            <path d="M4 11h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8z" />
          </svg>
        )}
      </div>
      <p className="text-lg font-semibold">{title}</p>
      {hint && <p className="hint mt-2 max-w-[46ch] mx-auto">{hint}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide, closeLabel }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  const close = closeLabel || translate(DEFAULT_LOCALE, 'ui.close');
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-surface w-full shadow-elevated ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} rounded-t-xl sm:rounded-xl max-h-[92vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-surface/95 backdrop-blur-sm flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label={close} className="p-2 -mr-2 text-muted hover:text-ink hover:bg-wall rounded-card transition-colors">
            <Icon name="x" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, hint, children, required }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-out"> *</span>}</label>
      {children}
      {hint && <p className="hint mt-1.5 text-[13px]">{hint}</p>}
    </div>
  );
}

export function Toast({ msg, tone = 'ok', onDone }) {
  useEffect(() => { if (msg) { const tm = setTimeout(onDone, 3200); return () => clearTimeout(tm); } }, [msg, onDone]);
  if (!msg) return null;
  const bg = tone === 'out' ? 'bg-out' : 'bg-brand';
  return (
    <div role="status" className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] ${bg} text-white px-5 py-2.5 rounded-full font-medium text-sm shadow-elevated max-w-[90vw] animate-slide-up`}>
      {msg}
    </div>
  );
}

let apiLocale = DEFAULT_LOCALE;
export function setApiLocale(locale) { apiLocale = locale || DEFAULT_LOCALE; }

export async function api(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: opts.body && typeof opts.body !== 'string' ? JSON.stringify(opts.body) : opts.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || translate(apiLocale, 'errors.generic'));
  return data;
}

export function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => { const tm = setTimeout(() => setV(value), ms); return () => clearTimeout(tm); }, [value, ms]);
  return v;
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, tone = 'ok') => setToast({ msg, tone }), []);
  const node = <Toast msg={toast?.msg} tone={toast?.tone} onDone={() => setToast(null)} />;
  return [show, node];
}

export function StatePill({ state, labels }) {
  const map = {
    ok: ['pill-ok', labels?.ok || translate(apiLocale, 'ui.stockOk')],
    low: ['pill-low', labels?.low || translate(apiLocale, 'ui.stockLow')],
    out: ['pill-out', labels?.out || translate(apiLocale, 'ui.stockOut')],
  };
  const [cls, text] = map[state] || map.ok;
  return <span className={cls}>{text}</span>;
}
