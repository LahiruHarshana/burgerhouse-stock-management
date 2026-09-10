import { requireModule } from '@/lib/page';
import { Category, Location } from '@/models';
import ItemsClient from './ItemsClient';

export const dynamic = 'force-dynamic';

export default async function ItemsPage() {
  const { enabled, cur, user } = await requireModule('items');
  const [categories, locations] = await Promise.all([
    Category.find().sort({ sort: 1 }).lean(),
    Location.find({ active: true }).sort({ name: 1 }).lean(),
  ]);
  return (
    <ItemsClient
      categories={JSON.parse(JSON.stringify(categories))}
      locations={JSON.parse(JSON.stringify(locations))}
      enabled={enabled} cur={cur} role={user.role}
    />
  );
}
