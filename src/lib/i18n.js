import en from '@/messages/en.json';
import si from '@/messages/si.json';

export const LOCALES = ['en', 'si'];
export const DEFAULT_LOCALE = 'en';

const MESSAGES = { en, si };

export function t(locale, key, vars = {}) {
  const dict = MESSAGES[locale] || MESSAGES.en;
  let val = key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), dict);
  if (val === undefined) val = key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), MESSAGES.en);
  if (typeof val !== 'string') return key;
  return val.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

export function getMessages(locale) {
  return MESSAGES[locale] || MESSAGES.en;
}

export function getEnum(locale, group, value) {
  if (!value) return '';
  return t(locale, `enums.${group}.${value}`) || value;
}

export function displayName(entity, locale) {
  if (!entity) return '';
  return locale === 'si' ? (entity.nameSi || entity.name || '') : (entity.name || entity.nameSi || '');
}

export function displayModule(mod, locale) {
  if (!mod) return '';
  return locale === 'si' ? mod.si : mod.name;
}

export function moduleBlurb(key, locale) {
  return t(locale, `modules.${key}.blurb`);
}
