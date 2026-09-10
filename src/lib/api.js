import { NextResponse } from 'next/server';
import { db } from './db';
import { currentUser } from './auth';
import { Settings, Audit, User } from '@/models';
import { resolveEnabled } from './modules';
import { t, DEFAULT_LOCALE } from './i18n';

export const ok = (data, init) => NextResponse.json(data ?? { ok: true }, init);
export const bad = (msg, code = 400) => NextResponse.json({ error: msg }, { status: code });
export const badKey = (locale, key, status = 400, vars = {}) =>
  bad(t(locale, key, vars), status);

let settingsCache = { at: 0, doc: null };

/** Settings එක තත්පර 15ක් cache කරනවා -> හැම request එකකදිම DB එකට යන්නේ නෑ */
export async function getSettings(force = false) {
  await db();
  const now = Date.now();
  if (!force && settingsCache.doc && now - settingsCache.at < 15000) return settingsCache.doc;
  let doc = await Settings.findOne({ singleton: 'app' }).lean();
  if (!doc) doc = (await Settings.create({ singleton: 'app' })).toObject();
  settingsCache = { at: now, doc };
  return doc;
}
export function bustSettingsCache() { settingsCache = { at: 0, doc: null }; }

export async function getUserLocale(userId) {
  if (!userId) return DEFAULT_LOCALE;
  const doc = await User.findById(userId).select('locale').lean();
  return doc?.locale || DEFAULT_LOCALE;
}

/**
 * හැම protected API route එකකම මුලින්ම මේක call කරනවා.
 */
export async function guard({ module: mod, can } = {}) {
  await db();
  const user = await currentUser();
  if (!user) return { error: badKey(DEFAULT_LOCALE, 'errors.loginRequired', 401) };

  const locale = await getUserLocale(user.id);
  const settings = await getSettings();
  const enabled = resolveEnabled(settings.enabledModules);
  if (mod && !enabled.includes(mod)) {
    return { error: badKey(locale, 'errors.moduleDisabled', 403) };
  }
  if (can && !can(user)) return { error: badKey(locale, 'errors.forbidden', 403) };
  return { user, settings, enabled, locale };
}

export async function log(user, action, entity, entityId, detail) {
  try {
    await Audit.create({ user: user?.id, userName: user?.name, action, entity, entityId: String(entityId ?? ''), detail });
  } catch { /* log එක fail වුණාට main වැඩේ නවත්තන්නේ නෑ */ }
}

/** JSON body එක safe විදිහට කියවනවා */
export async function body(req) {
  try { return await req.json(); } catch { return {}; }
}

/** Translate stock.js thrown errors */
export function translateStockError(locale, e) {
  if (e?.i18nKey) return t(locale, e.i18nKey, e.vars || {});
  return e?.message || t(locale, 'errors.generic');
}
