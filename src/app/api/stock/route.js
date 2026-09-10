import { Item } from '@/models';
import { mongoose } from '@/lib/db';
import { guard, ok } from '@/lib/api';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
/** තොග තත්ත්වය එක aggregation එකකින් — item දහස් ගණනකදිත් වේගවත් */
export async function GET(req) {
  const g = await guard({ module: 'stock' });
  if (g.error) return g.error;
  const s = new URL(req.url).searchParams;

  const match = { active: true };
  if (s.get('beverage') === '1') match['beverage.isBeverage'] = true;
  if (s.get('category')) match.category = new mongoose.Types.ObjectId(s.get('category'));

  const levelPipeline = [];
  if (s.get('location')) {
    levelPipeline.push({ $match: { $expr: { $eq: ['$location', new mongoose.Types.ObjectId(s.get('location'))] } } });
  }

  let rows = await Item.aggregate([
    { $match: match },
    { $lookup: { from: 'stocklevels', localField: '_id', foreignField: 'item', as: 'lv', pipeline: levelPipeline } },
    { $addFields: { qty: { $ifNull: [{ $sum: '$lv.qty' }, 0] } } },
    { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } },
    { $project: {
        code: 1, name: 1, nameSi: 1, unit: 1, qty: 1, reorderLevel: 1, maxLevel: 1,
        costPerUnit: 1, trackExpiry: 1,
        category: { $first: '$cat.name' },
        value: { $multiply: ['$qty', { $ifNull: ['$costPerUnit', 0] }] },
    } },
    { $sort: { name: 1 } },
  ]);

  const state = s.get('state');
  if (state === 'low') rows = rows.filter((r) => r.reorderLevel > 0 && r.qty > 0 && r.qty <= r.reorderLevel);
  if (state === 'out') rows = rows.filter((r) => r.qty <= 0);

  return ok({ rows, totalValue: rows.reduce((a, r) => a + (r.value || 0), 0) });
}
