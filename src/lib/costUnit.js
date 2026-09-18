import { money, n } from './fmt';

/**
 * Stock is always stored per base unit (g, ml, pcs…).
 * Users enter prices in a friendlier unit: kg instead of g, L instead of ml.
 */
export function getCostEntryMeta(baseUnit) {
  const u = (baseUnit || 'pcs').toLowerCase();
  if (u === 'g') return { displayUnit: 'kg', factor: 1000, step: '1' };
  if (u === 'ml') return { displayUnit: 'L', factor: 1000, step: '1' };
  return { displayUnit: u, factor: 1, step: '0.01' };
}

export function toDisplayCost(baseUnit, costPerUnit) {
  const v = Number(costPerUnit);
  if (!v || !isFinite(v)) return '';
  const { factor } = getCostEntryMeta(baseUnit);
  return roundCost(v * factor);
}

export function toBaseCost(baseUnit, displayCost) {
  const v = Number(displayCost);
  if (!v || !isFinite(v)) return 0;
  const { factor } = getCostEntryMeta(baseUnit);
  return roundCost(v / factor, 6);
}

function roundCost(v, digits = 2) {
  const p = 10 ** digits;
  return Math.round(v * p) / p;
}

/** Table / cards — "Rs. 1,650 / kg" */
export function formatItemCost(costPerUnit, baseUnit, cur = 'Rs.') {
  const v = Number(costPerUnit) || 0;
  const { displayUnit, factor } = getCostEntryMeta(baseUnit);
  const shown = roundCost(v * factor);
  return `${money(shown, cur)} / ${displayUnit}`;
}

/** Small note under the input when display unit ≠ base unit */
export function formatBaseCostNote(costPerUnit, baseUnit, cur = 'Rs.') {
  const u = (baseUnit || 'pcs').toLowerCase();
  const { displayUnit, factor } = getCostEntryMeta(baseUnit);
  if (factor === 1) return '';
  const v = Number(costPerUnit) || 0;
  return { baseUnit: u, amount: money(v, cur), displayUnit };
}
