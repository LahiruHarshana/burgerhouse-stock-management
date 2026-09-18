import { money } from './fmt';

function roundCost(v, digits = 2) {
  const p = 10 ** digits;
  return Math.round(v * p) / p;
}

/** Form එක open කරන වෙලාවට පෙන්වන්න default ප්‍රමාණය */
export function getDefaultCostQty(baseUnit) {
  const u = (baseUnit || 'pcs').toLowerCase();
  if (u === 'g' || u === 'ml') return 1000;
  return 1;
}

/** ප්‍රමාණය + මුළු මිල → base unit එකක පිරිවැය */
export function calcCostPerUnit(qty, total) {
  const q = Number(qty);
  const t = Number(total);
  if (!q || q <= 0 || !isFinite(t)) return 0;
  return roundCost(t / q, 6);
}

/** Table — "Rs. 1.35 / ml" */
export function formatItemCost(costPerUnit, baseUnit, cur = 'Rs.') {
  const v = Number(costPerUnit) || 0;
  const u = (baseUnit || 'pcs').toLowerCase();
  return `${money(v, cur)} / ${u}`;
}

/** Calculated hints — e.g. ml 1කට + L 1කට */
export function formatCalculatedCostLines(costPerUnit, baseUnit, cur = 'Rs.') {
  const u = (baseUnit || 'pcs').toLowerCase();
  const v = Number(costPerUnit) || 0;
  if (!v) return [];

  const lines = [{ unit: u, amount: money(v, cur) }];
  if (u === 'g') lines.push({ unit: 'kg', amount: money(v * 1000, cur) });
  if (u === 'ml') lines.push({ unit: 'L', amount: money(v * 1000, cur) });
  return lines;
}
