import { requireModule } from '@/lib/page';
import RecipesClient from './RecipesClient';
export const dynamic = 'force-dynamic';
export default async function P() {
  const { cur, user } = await requireModule('recipes');
  return <RecipesClient cur={cur} role={user.role} />;
}
