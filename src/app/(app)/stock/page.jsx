import { requireModule } from '@/lib/page';
import { Location } from '@/models';
import StockClient from './StockClient';
export const dynamic = 'force-dynamic';

export default async function StockPage() {
  const { cur, user } = await requireModule('stock');
  const locations = await Location.find({ active: true }).sort({ name: 1 }).lean();
  return <StockClient locations={JSON.parse(JSON.stringify(locations))} cur={cur} role={user.role} />;
}
