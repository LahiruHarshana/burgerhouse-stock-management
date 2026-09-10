import { requireModule } from '@/lib/page';
import { Location } from '@/models';
import BranchesClient from './BranchesClient';
export const dynamic = 'force-dynamic';
export default async function P() {
  const { user } = await requireModule('multibranch');
  const locations = await Location.find().sort({ branch: 1, name: 1 }).lean();
  return <BranchesClient locations={JSON.parse(JSON.stringify(locations))} role={user.role} />;
}
