'use client';
import { Field } from '@/components/ui';
import { useI18n } from '@/components/I18nProvider';
import {
  getCostEntryMeta, toDisplayCost, toBaseCost, formatBaseCostNote,
} from '@/lib/costUnit';

export default function CostInput({ unit, value, onChange, hint }) {
  const { t } = useI18n();
  const meta = getCostEntryMeta(unit);
  const display = toDisplayCost(unit, value);
  const base = formatBaseCostNote(value, unit);

  return (
    <Field
      label={t('pages.items.costDisplay', { unit: meta.displayUnit })}
      hint={hint || (base ? t('pages.items.costBaseNote', base) : t('pages.items.costHint'))}
    >
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none">Rs.</span>
        <input
          className="field num pl-11"
          type="number"
          step={meta.step}
          min="0"
          value={display}
          placeholder="0"
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === '' ? '' : toBaseCost(unit, raw));
          }}
        />
      </div>
    </Field>
  );
}
