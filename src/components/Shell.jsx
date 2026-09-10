'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Icon from './Icon';
import { MODULE_MAP } from '@/lib/modules';
import { useI18n } from './I18nProvider';
import LocaleSwitcher from './LocaleSwitcher';

export default function Shell({ user, shopName, enabled, alerts = 0, children }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { t, displayModule } = useI18n();

  const nav = [
    { href: '/', label: t('shell.home'), icon: 'home' },
    ...enabled.map((k) => {
      const m = MODULE_MAP[k];
      return m ? { href: m.href, label: displayModule(m), icon: m.icon } : null;
    }).filter(Boolean),
  ];
  const isAdmin = user.role === 'OWNER';

  const link = (n) => {
    const active = n.href === '/' ? path === '/' : path.startsWith(n.href);
    return (
      <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
        className={`flex items-center gap-3 h-11 px-3 rounded-card font-medium text-[15px] transition-colors
          ${active
            ? 'bg-brand-light text-brand-dark'
            : 'text-muted hover:text-ink hover:bg-wall'}`}>
        <Icon name={n.icon} size={20} />
        <span className="truncate">{n.label}</span>
        {n.href === '/stock' && alerts > 0 && (
          <span className="ml-auto num text-[12px] font-bold bg-low text-white rounded-full px-2 py-0.5">{alerts}</span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen lg:flex bg-wall">
      <div className="lg:hidden sticky top-0 z-40 flex items-center gap-3 h-14 px-4 bg-surface border-b border-line shadow-sm">
        <button onClick={() => setOpen(true)} aria-label={t('shell.menu')} className="p-2 -ml-2 text-ink hover:bg-wall rounded-card">
          <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <span className="font-semibold truncate text-ink">{shopName}</span>
      </div>

      {open && <div className="lg:hidden fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      <aside className={`fixed lg:sticky top-0 z-50 lg:z-0 h-screen w-[264px] shrink-0 bg-surface border-r border-line flex flex-col shadow-sm
        ${open ? 'left-0' : '-left-[280px]'} lg:left-0 transition-[left] duration-200`}>
        <div className="px-4 pt-5 pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand text-white grid place-items-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11h18M5 11V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
                <path d="M4 17h16" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[15px] leading-tight truncate text-ink">{shopName}</p>
              <p className="text-muted text-[12px] mt-0.5">{t('shell.tagline')}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">{nav.map(link)}</nav>

        <div className="border-t border-line p-2">
          <div className="px-2 py-2">
            <LocaleSwitcher variant="app" />
          </div>
          {isAdmin && (
            <Link href="/settings" onClick={() => setOpen(false)}
              className={`flex items-center gap-3 h-11 px-3 rounded-card font-medium text-[15px] transition-colors
                ${path.startsWith('/settings')
                  ? 'bg-brand-light text-brand-dark'
                  : 'text-muted hover:text-ink hover:bg-wall'}`}>
              <Icon name="gear" size={20} /><span>{t('shell.settings')}</span>
            </Link>
          )}
          <div className="flex items-center gap-3 px-3 py-3 mt-1">
            <div className="w-9 h-9 rounded-full bg-brand-light text-brand-dark ring-2 ring-brand/10 grid place-items-center font-bold text-sm shrink-0">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-ink">{user.name}</p>
              <span className="inline-block text-[11px] font-medium text-muted bg-wall px-1.5 py-0.5 rounded mt-0.5">{user.role}</span>
            </div>
            <form action="/api/auth/logout" method="post">
              <button className="p-2 text-muted hover:text-ink hover:bg-wall rounded-card transition-colors" aria-label={t('shell.logout')} title={t('shell.logout')}>
                <Icon name="out" size={18} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
