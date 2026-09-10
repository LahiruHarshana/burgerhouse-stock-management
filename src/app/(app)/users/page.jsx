import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/page';
import UsersClient from './UsersClient';
export const dynamic = 'force-dynamic';
export default async function P() {
  const { user } = await requireModule('users');
  if (!['OWNER', 'MANAGER'].includes(user.role)) redirect('/');
  return <UsersClient me={user} />;
}
