'use client';
import { useEffect } from 'react';
import { useI18n } from './I18nProvider';
import { money, dateTime } from '@/lib/fmt';

export default function BillReceipt({ sale, shopName, cur }) {
  const { t, getEnum } = useI18n();
  if (!sale) return null;

  return (
    <article className="bill-print w-[80mm] max-w-full mx-auto bg-white text-black p-4 font-sans text-[13px] leading-snug">
      <h1 className="text-center font-bold text-base tracking-tight">{shopName}</h1>
      <p className="text-center num mt-1 font-semibold">{sale.ref}</p>
      <p className="text-center text-[12px] mt-0.5">{dateTime(sale.at)}</p>
      {sale.userName && (
        <p className="text-center text-[12px]">{t('pages.terminal.cashier')}: {sale.userName}</p>
      )}
      <hr className="my-2 border-black/40" />
      <table className="w-full">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide">
            <th className="text-left font-semibold pb-1">{t('pages.terminal.item')}</th>
            <th className="text-center font-semibold pb-1 w-8">{t('pages.terminal.qty')}</th>
            <th className="text-right font-semibold pb-1">{t('pages.sales.colAmount')}</th>
          </tr>
        </thead>
        <tbody>
          {(sale.lines || []).map((l, i) => (
            <tr key={`${l.name}-${i}`}>
              <td className="py-0.5 pr-1 align-top">{l.name}</td>
              <td className="py-0.5 text-center num align-top">{l.qty}</td>
              <td className="py-0.5 text-right num align-top whitespace-nowrap">{money((l.price || 0) * (l.qty || 0), cur)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="my-2 border-black/40" />
      <div className="flex justify-between items-baseline font-bold text-base">
        <span>{t('pages.sales.cartTotal')}</span>
        <span className="num">{money(sale.total, cur)}</span>
      </div>
      {sale.paymentMethod && (
        <p className="mt-1.5 text-[12px]">
          {t('pages.terminal.pay')}: {getEnum('payment', sale.paymentMethod)}
        </p>
      )}
      {sale.serviceType && (
        <p className="text-[12px]">
          {getEnum('serviceType', sale.serviceType)}
        </p>
      )}
      <p className="text-center mt-4 text-[12px]">{t('pages.terminal.thanks')}</p>
    </article>
  );
}

export function BillPreview({ sale, shopName, cur, autoPrint, onDone, doneLabel }) {
  const { t } = useI18n();

  useEffect(() => {
    if (!sale || !autoPrint) return;
    const tm = setTimeout(() => window.print(), 250);
    return () => clearTimeout(tm);
  }, [sale, autoPrint]);

  if (!sale) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('pages.terminal.printBill')}
    >
      <div className="bg-surface w-full sm:max-w-md rounded-t-xl sm:rounded-xl shadow-elevated max-h-[92vh] overflow-y-auto">
        <div className="px-5 pt-5 pb-3 flex flex-wrap gap-2">
          <button type="button" className="btn-primary flex-1" onClick={() => window.print()}>
            {t('pages.terminal.printBill')}
          </button>
          <button type="button" className="btn-ghost flex-1" onClick={onDone}>
            {doneLabel || t('pages.terminal.newOrder')}
          </button>
        </div>
        <BillReceipt sale={sale} shopName={shopName} cur={cur} />
      </div>
    </div>
  );
}
