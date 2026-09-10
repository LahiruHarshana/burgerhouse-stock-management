import { requireModule } from '@/lib/page';
import { Location } from '@/models';
import PurchasingClient from './PurchasingClient';
export const dynamic = 'force-dynamic';
export default async function P() {
  const { cur, user } = await requireModule('purchasing');
  const locations = await Location.find({ active: true }).lean();
  return <PurchasingClient locations={JSON.parse(JSON.stringify(locations))} cur={cur} role={user.role} />;
}
