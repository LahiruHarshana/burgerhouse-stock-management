import { requireModule } from '@/lib/page';
import { Location } from '@/models';
import SalesClient from './SalesClient';
export const dynamic = 'force-dynamic';
export default async function P() {
  const { cur } = await requireModule('sales');
  const locations = await Location.find({ active: true }).lean();
  return <SalesClient locations={JSON.parse(JSON.stringify(locations))} cur={cur} />;
}
