'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Page, Empty, api } from '@/components/ui';
import Icon from '@/components/Icon';
import { BillPreview } from '@/components/BillReceipt';
import { useI18n } from '@/components/I18nProvider';
import { n, money, dateTime } from '@/lib/fmt';

export default function SalesClient({ cur, canRecord, shopName }) {
  const { t } = useI18n();
  const [d, setD] = useState({ rows: [], totals: { sales: 0, cost: 0 } });
  const [reprint, setReprint] = useState(null);

  const load = useCallback(async () => {
    const a = await api('/api/sales');
    setD(a);
  }, []);
  useEffect(() => { load().catch(() => {}); }, [load]);

  const pct = d.totals.sales > 0 ? (d.totals.cost / d.totals.sales) * 100 : null;

  return (
    <Page title={t('pages.sales.title')} subtitle={t('pages.sales.subtitle')}
      action={canRecord ? (
        <Link href="/terminal" className="btn-primary">
          <Icon name="receipt" size={18} /> {t('pages.sales.openTerminal')}
        </Link>
      ) : null}>

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <div className="card p-4"><p className="hint">{t('pages.sales.statSales')}</p><p className="num text-2xl font-bold mt-1">{money(d.totals.sales, cur)}</p></div>
        <div className="card p-4"><p className="hint">{t('pages.sales.statCost')}</p><p className="num text-2xl font-bold mt-1">{money(d.totals.cost, cur)}</p></div>
        <div className="card p-4"><p className="hint">{t('pages.sales.statFoodCost')}</p>
          <p className={`num text-2xl font-bold mt-1 ${pct == null ? '' : pct > 40 ? 'text-out' : pct > 32 ? 'text-low' : 'text-ok'}`}>
            {pct == null ? '—' : `${n(pct, 1)}%`}</p></div>
      </div>

      {d.rows.length === 0 ? (
        <Empty title={t('pages.sales.emptyTitle')} hint={t('pages.sales.emptyHint')}
          action={canRecord ? (
            <Link href="/terminal" className="btn-primary">
              <Icon name="receipt" size={18} /> {t('pages.sales.openTerminal')}
            </Link>
          ) : null} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead><tr><th className="th">{t('pages.sales.colNo')}</th><th className="th">{t('common.date')}</th><th className="th">{t('pages.sales.colItems')}</th>
              <th className="th text-right">{t('pages.sales.colAmount')}</th><th className="th text-right">{t('common.cost')}</th>
              <th className="th w-14"><span className="sr-only">{t('common.print')}</span></th></tr></thead>
            <tbody>
              {d.rows.map((s) => (
                <tr key={s._id}>
                  <td className="td num">{s.ref}</td>
                  <td className="td hint whitespace-nowrap">{dateTime(s.at)}</td>
                  <td className="td">{s.lines.map((l) => `${l.name} ×${l.qty}`).join(', ')}</td>
                  <td className="td num text-right font-semibold">{money(s.total, cur)}</td>
                  <td className="td num text-right hint">{money(s.totalCost, cur)}</td>
                  <td className="td text-right">
                    <button
                      type="button"
                      className="p-2 text-muted hover:text-ink hover:bg-wall rounded-card"
                      aria-label={t('pages.terminal.printBill')}
                      title={t('pages.terminal.printBill')}
                      onClick={() => setReprint(s)}
                    >
                      <Icon name="printer" size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reprint && (
        <BillPreview
          sale={reprint}
          shopName={shopName}
          cur={cur}
          autoPrint
          onDone={() => setReprint(null)}
          doneLabel={t('common.back')}
        />
      )}
    </Page>
  );
}
