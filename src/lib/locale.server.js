import { cookies } from 'next/headers';
import { LOCALE_COOKIE, resolveLocale } from '@/lib/locale';
import { LOCALES, DEFAULT_LOCALE } from '@/lib/i18n';

export function getLocaleCookie() {
  const raw = cookies().get(LOCALE_COOKIE)?.value;
  return raw && LOCALES.includes(raw) ? raw : null;
}

/** Prefer the locale cookie (set instantly on toggle); fall back to the user record in DB. */
export function getAppLocale(dbLocale) {
  return getLocaleCookie() || resolveLocale(dbLocale);
}

/** Auth pages: cookie if set, otherwise English. */
export function getAuthLocale() {
  return getAppLocale(DEFAULT_LOCALE);
}
