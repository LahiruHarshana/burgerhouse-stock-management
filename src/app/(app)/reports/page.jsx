import { requireModule } from '@/lib/page';
import ReportsClient from './ReportsClient';
export const dynamic = 'force-dynamic';
export default async function P() {
  const { cur, enabled } = await requireModule('reports');
  return <ReportsClient cur={cur} enabled={enabled} />;
}
