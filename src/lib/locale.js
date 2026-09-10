import { LOCALES, DEFAULT_LOCALE } from '@/lib/i18n';

export const LOCALE_COOKIE = 'locale';

export function resolveLocale(value) {
  return LOCALES.includes(value) ? value : DEFAULT_LOCALE;
}

export function setLocaleCookie(locale) {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}
