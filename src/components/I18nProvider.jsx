'use client';
import { createContext, useContext, useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { t as translate, displayName, displayModule, moduleBlurb, getEnum } from '@/lib/i18n';
import { resolveLocale } from '@/lib/locale';
import { setApiLocale } from '@/components/ui';

const Ctx = createContext(null);

export function I18nProvider({ locale, children }) {
  const [activeLocale, setActiveLocale] = useState(() => resolveLocale(locale));
  const pendingLocale = useRef(null);

  useEffect(() => {
    const resolved = resolveLocale(locale);
    // Don't let a stale server refresh overwrite an in-flight user selection.
    if (pendingLocale.current) {
      if (resolved === pendingLocale.current) pendingLocale.current = null;
      else return;
    }
    setActiveLocale(resolved);
  }, [locale]);

  useEffect(() => {
    setApiLocale(activeLocale);
    document.documentElement.lang = activeLocale;
  }, [activeLocale]);

  const setLocale = useCallback((next) => {
    const resolved = resolveLocale(next);
    pendingLocale.current = resolved;
    setActiveLocale(resolved);
  }, []);

  const value = useMemo(() => ({
    locale: activeLocale,
    setLocale,
    t: (key, vars) => translate(activeLocale, key, vars),
    displayName: (entity) => displayName(entity, activeLocale),
    displayModule: (mod) => displayModule(mod, activeLocale),
    moduleBlurb: (key) => moduleBlurb(key, activeLocale),
    getEnum: (group, value) => getEnum(activeLocale, group, value),
  }), [activeLocale, setLocale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
