import { requireModule } from '@/lib/page';
import { Location, Category } from '@/models';
import StocktakeClient from './StocktakeClient';
export const dynamic = 'force-dynamic';
export default async function P() {
  const { cur, user } = await requireModule('stocktake');
  const [locations, categories] = await Promise.all([
    Location.find({ active: true }).lean(), Category.find().sort({ sort: 1 }).lean(),
  ]);
  return <StocktakeClient locations={JSON.parse(JSON.stringify(locations))}
    categories={JSON.parse(JSON.stringify(categories))} cur={cur} role={user.role} />;
}
