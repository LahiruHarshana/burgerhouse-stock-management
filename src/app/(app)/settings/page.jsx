import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/page';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const { user, settings, enabled, locale } = await requireModule();
  if (user.role !== 'OWNER') redirect('/');
  return <SettingsClient enabled={enabled} locale={locale} settings={JSON.parse(JSON.stringify({
    shopName: settings.shopName, currency: settings.currency,
    costingMethod: settings.costingMethod, lowStockDays: settings.lowStockDays,
    apiKey: settings.apiKey,
  }))} />;
}
