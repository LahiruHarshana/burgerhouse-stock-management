import { Item, Movement, Wastage, Sale, Recipe, StockLevel, GRN } from '@/models';
import { guard, ok, badKey } from '@/lib/api';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
/** GET /api/reports/<type>?from=&to= */
export async function GET(req, { params }) {
  const g = await guard({ module: 'reports' });
  if (g.error) return g.error;
  const s = new URL(req.url).searchParams;
  const from = s.get('from') ? new Date(s.get('from')) : new Date(Date.now() - 30 * 86400000);
  const to = s.get('to') ? new Date(s.get('to') + 'T23:59:59') : new Date();
  const range = { $gte: from, $lte: to };

  switch (params.type) {
    /* තොගයේ වටිනාකම */
    case 'valuation': {
      const rows = await Item.aggregate([
        { $match: { active: true } },
        { $lookup: { from: 'stocklevels', localField: '_id', foreignField: 'item', as: 'lv' } },
        { $addFields: { qty: { $ifNull: [{ $sum: '$lv.qty' }, 0] } } },
        { $project: { code: 1, name: 1, unit: 1, qty: 1, costPerUnit: 1,
            value: { $multiply: ['$qty', { $ifNull: ['$costPerUnit', 0] }] } } },
        { $match: { qty: { $ne: 0 } } },
        { $sort: { value: -1 } },
      ]);
      return ok({ rows, total: rows.reduce((a, r) => a + r.value, 0) });
    }

    /* පාවිච්චිය — වේගයෙන් යන / නොයන බඩු */
    case 'consumption': {
      const rows = await Movement.aggregate([
        { $match: { at: range, reason: { $in: ['SALE', 'WASTAGE', 'PRODUCTION_OUT'] } } },
        { $group: { _id: '$item', qty: { $sum: { $abs: '$qty' } }, value: { $sum: { $abs: { $multiply: ['$qty', '$unitCost'] } } } } },
        { $lookup: { from: 'items', localField: '_id', foreignField: '_id', as: 'i' } },
        { $project: { qty: 1, value: 1, name: { $first: '$i.name' }, code: { $first: '$i.code' }, unit: { $first: '$i.unit' } } },
        { $sort: { value: -1 } },
      ]);
      return ok({ rows });
    }

    /* චලනයක්ම නැති බඩු (dead stock) */
    case 'dead': {
      const active = await Movement.distinct('item', { at: range });
      const rows = await Item.aggregate([
        { $match: { active: true, _id: { $nin: active } } },
        { $lookup: { from: 'stocklevels', localField: '_id', foreignField: 'item', as: 'lv' } },
        { $addFields: { qty: { $ifNull: [{ $sum: '$lv.qty' }, 0] } } },
        { $match: { qty: { $gt: 0 } } },
        { $project: { code: 1, name: 1, unit: 1, qty: 1, value: { $multiply: ['$qty', { $ifNull: ['$costPerUnit', 0] }] } } },
        { $sort: { value: -1 } },
      ]);
      return ok({ rows, total: rows.reduce((a, r) => a + r.value, 0) });
    }

    /* නාස්තිය හේතුව අනුව */
    case 'wastage': {
      const rows = await Wastage.aggregate([
        { $match: { at: range } },
        { $group: { _id: { reason: '$reason', item: '$item' }, qty: { $sum: '$qty' }, cost: { $sum: '$cost' } } },
        { $lookup: { from: 'items', localField: '_id.item', foreignField: '_id', as: 'i' } },
        { $project: { reason: '$_id.reason', qty: 1, cost: 1, name: { $first: '$i.name' }, unit: { $first: '$i.unit' } } },
        { $sort: { cost: -1 } },
      ]);
      return ok({ rows, total: rows.reduce((a, r) => a + r.cost, 0) });
    }

    /* Food cost % සහ menu item එකක ලාභය */
    case 'margin': {
      const recipes = await Recipe.find({ active: true, kind: 'MENU' }).select('name sellPrice cachedCost yieldQty').lean();
      const sold = await Sale.aggregate([
        { $match: { at: range } }, { $unwind: '$lines' },
        { $group: { _id: '$lines.recipe', qty: { $sum: '$lines.qty' }, revenue: { $sum: { $multiply: ['$lines.price', '$lines.qty'] } }, cost: { $sum: { $multiply: ['$lines.cost', '$lines.qty'] } } } },
      ]);
      const smap = Object.fromEntries(sold.map((r) => [String(r._id), r]));
      const rows = recipes.map((r) => {
        const cost = (r.cachedCost || 0) / (r.yieldQty || 1);
        const price = r.sellPrice || 0;
        const sv = smap[String(r._id)];
        return {
          name: r.name, price, cost,
          margin: price - cost,
          foodCostPct: price > 0 ? (cost / price) * 100 : 0,
          soldQty: sv?.qty || 0, revenue: sv?.revenue || 0, totalCost: sv?.cost || 0,
        };
      }).sort((a, b) => b.revenue - a.revenue);
      const rev = rows.reduce((a, r) => a + r.revenue, 0);
      const cst = rows.reduce((a, r) => a + r.totalCost, 0);
      return ok({ rows, revenue: rev, cost: cst, overallFoodCostPct: rev > 0 ? (cst / rev) * 100 : 0 });
    }

    /* Supplier / item අනුව මිලදී ගැනීම් */
    case 'purchases': {
      const rows = await GRN.aggregate([
        { $match: { receivedAt: range } },
        { $group: { _id: '$supplierName', total: { $sum: '$total' }, n: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]);
      return ok({ rows, total: rows.reduce((a, r) => a + r.total, 0) });
    }

    default: return badKey(g.locale, 'errors.reportNotFound', 404);
  }
}
