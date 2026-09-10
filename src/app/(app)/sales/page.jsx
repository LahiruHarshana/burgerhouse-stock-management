import { requireModule } from '@/lib/page';
import { CAN } from '@/lib/auth';
import SalesClient from './SalesClient';
export const dynamic = 'force-dynamic';
export default async function P() {
  const { cur, user, settings } = await requireModule('sales');
  return <SalesClient cur={cur} canRecord={CAN.record(user)} shopName={settings.shopName} />;
}
