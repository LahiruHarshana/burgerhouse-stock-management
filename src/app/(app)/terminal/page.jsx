import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/page';
import { CAN } from '@/lib/auth';
import { Location } from '@/models';
import TerminalClient from './TerminalClient';

export const dynamic = 'force-dynamic';

export default async function TerminalPage() {
  const { user, settings, cur } = await requireModule('sales');
  if (!CAN.record(user)) redirect('/sales');
  const locations = await Location.find({ active: true }).lean();
  return (
    <TerminalClient
      locations={JSON.parse(JSON.stringify(locations))}
      cur={cur}
      shopName={settings.shopName}
      cashierName={user.name}
    />
  );
}
