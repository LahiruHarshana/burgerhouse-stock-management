export const n = (v, d = 2) => {
  const x = Number(v || 0);
  return x.toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: d });
};
export const money = (v, cur = 'Rs.') => `${cur} ${n(v, 2)}`;
export const date = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
export const dateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—';
export const daysLeft = (d) => d ? Math.ceil((new Date(d) - Date.now()) / 86400000) : null;

export function stockState(qty, reorder) {
  if (qty <= 0) return 'out';
  if (reorder > 0 && qty <= reorder) return 'low';
  return 'ok';
}

// Legacy helpers — use useI18n().getEnum() in client components
import { getEnum } from './i18n';
export function reasonLabel(locale, key) { return getEnum(locale, 'reason', key); }
export function wasteLabel(locale, key) { return getEnum(locale, 'waste', key); }
export function roleLabel(locale, key) { return getEnum(locale, 'roles', key); }
