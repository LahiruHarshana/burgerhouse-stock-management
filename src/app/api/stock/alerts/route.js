import { Item, StockLevel, Batch } from '@/models';
import { guard, ok } from '@/lib/api';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
/** Dashboard එකට: අඩු වෙච්ච, ඉවර වෙච්ච සහ expire වෙන්න යන ඒවා */
export async function GET() {
  const g = await guard({ module: 'items' });
  if (g.error) return g.error;
  const hasStock = g.enabled.includes('stock');
  if (!hasStock) return ok({ low: [], out: [], expiring: [], counts: { low: 0, out: 0, expiring: 0 } });

  const days = g.settings.lowStockDays || 7;
  const until = new Date(Date.now() + days * 86400000);

  const [levelRows, expiring] = await Promise.all([
    Item.aggregate([
      { $match: { active: true } },
      { $lookup: { from: 'stocklevels', localField: '_id', foreignField: 'item', as: 'lv' } },
      { $addFields: { qty: { $sum: '$lv.qty' } } },
      { $match: { $or: [{ qty: { $lte: 0 } }, { $expr: { $and: [{ $gt: ['$reorderLevel', 0] }, { $lte: ['$qty', '$reorderLevel'] }] } }] } },
      { $project: { code: 1, name: 1, nameSi: 1, unit: 1, qty: 1, reorderLevel: 1 } },
      { $limit: 200 },
    ]),
    Batch.find({ qty: { $gt: 0 }, expiry: { $ne: null, $lte: until } })
      .sort({ expiry: 1 }).limit(50).populate('item', 'name nameSi unit code').lean(),
  ]);

  const out = levelRows.filter((r) => r.qty <= 0);
  const low = levelRows.filter((r) => r.qty > 0);
  return ok({ low, out, expiring, counts: { low: low.length, out: out.length, expiring: expiring.length } });
}
