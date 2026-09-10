import { requireModule } from '@/lib/page';
import { Location } from '@/models';
import WastageClient from './WastageClient';
export const dynamic = 'force-dynamic';
export default async function P() {
  const { cur } = await requireModule('wastage');
  const locations = await Location.find({ active: true }).lean();
  return <WastageClient locations={JSON.parse(JSON.stringify(locations))} cur={cur} />;
}
