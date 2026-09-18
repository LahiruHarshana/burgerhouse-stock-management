'use client';
import { useEffect, useState } from 'react';
import { Field } from '@/components/ui';
import { useI18n } from '@/components/I18nProvider';
import {
  calcCostPerUnit, getDefaultCostQty, formatCalculatedCostLines,
} from '@/lib/costUnit';

export default function CostInput({ unit, value, onChange, itemKey, hint }) {
  const { t } = useI18n();
  const u = (unit || 'pcs').toLowerCase();
  const [qty, setQty] = useState('');
  const [total, setTotal] = useState('');

  useEffect(() => {
    const c = Number(value);
    const q = getDefaultCostQty(u);
    if (c > 0) {
      setQty(String(q));
      setTotal(String(Math.round(c * q * 100) / 100));
    } else {
      setQty('');
      setTotal('');
    }
  }, [itemKey, u]);

  function sync(nextQty, nextTotal) {
    setQty(nextQty);
    setTotal(nextTotal);
    const qn = Number(nextQty);
    const tn = Number(nextTotal);
    if (nextQty === '' || nextTotal === '') {
      onChange('');
      return;
    }
    if (qn > 0 && tn >= 0) onChange(calcCostPerUnit(qn, tn));
  }

  const perUnit = Number(value) || 0;
  const calcLines = formatCalculatedCostLines(perUnit, u);

  return (
    <div className="sm:col-span-2 space-y-2">
      <p className="label">{t('pages.items.costPackTitle')}</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={t('pages.items.costQty', { unit: u })} hint={t('pages.items.costQtyHint')}>
          <input
            className="field num"
            type="number"
            step="any"
            min="0"
            value={qty}
            placeholder={String(getDefaultCostQty(u))}
            onChange={(e) => sync(e.target.value, total)}
          />
        </Field>
        <Field label={t('pages.items.costTotal')}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none">Rs.</span>
            <input
              className="field num pl-11"
              type="number"
              step="1"
              min="0"
              value={total}
              placeholder="0"
              onChange={(e) => sync(qty, e.target.value)}
            />
          </div>
        </Field>
      </div>

      {calcLines.length > 0 && (
        <p className="hint text-[13px]">
          {calcLines.map((line, i) => (
            <span key={line.unit}>
              {i > 0 && ' · '}
              {t('pages.items.costCalculated', line)}
            </span>
          ))}
        </p>
      )}

      {hint && <p className="hint text-[13px]">{hint}</p>}
      {!hint && <p className="hint text-[13px]">{t('pages.items.costHint')}</p>}
    </div>
  );
}
