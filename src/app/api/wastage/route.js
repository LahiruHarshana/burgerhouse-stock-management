import { Wastage, Item, Location } from '@/models';
import { guard, ok, bad, badKey, body, log, translateStockError } from '@/lib/api';
import { CAN } from '@/lib/auth';
import { moveStock } from '@/lib/stock';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function GET(req) {
  const g = await guard({ module: 'wastage' });
  if (g.error) return g.error;
  const s = new URL(req.url).searchParams;
  const q = {};
  if (s.get('reason')) q.reason = s.get('reason');
  if (s.get('from')) q.at = { $gte: new Date(s.get('from')) };
  if (s.get('to')) q.at = { ...(q.at || {}), $lte: new Date(s.get('to') + 'T23:59:59') };
  const [rows, agg] = await Promise.all([
    Wastage.find(q).sort({ at: -1 }).limit(200).populate('item', 'name nameSi unit').lean(),
    Wastage.aggregate([{ $match: q }, { $group: { _id: '$reason', cost: { $sum: '$cost' }, n: { $sum: 1 } } }, { $sort: { cost: -1 } }]),
  ]);
  return ok({ rows, byReason: agg, totalCost: agg.reduce((a, r) => a + r.cost, 0) });
}

export async function POST(req) {
  const g = await guard({ module: 'wastage', can: CAN.record });
  if (g.error) return g.error;
  const b = await body(req);
  const qty = Number(b.qty);
  if (!b.item || !(qty > 0)) return badKey(g.locale, 'errors.itemQtyRequired');
  if (!b.reason) return badKey(g.locale, 'errors.reasonRequired');

  const item = await Item.findById(b.item).select('name costPerUnit').lean();
  if (!item) return badKey(g.locale, 'errors.itemNotFound');
  const location = b.location || (await Location.findOne({ active: true }).select('_id').lean())?._id;

  try {
    await moveStock({
      item: b.item, location, qty: -qty, reason: 'WASTAGE',
      note: `${b.reason}${b.note ? ' — ' + b.note : ''}`, user: g.user, allowNegative: false,
    });
  } catch (e) { return bad(translateStockError(g.locale, e)); }

  const w = await Wastage.create({
    item: b.item, itemName: item.name, location, qty,
    cost: qty * (item.costPerUnit || 0), reason: b.reason, note: b.note,
    user: g.user.id, userName: g.user.name, at: b.at || new Date(),
  });
  await log(g.user, 'WASTAGE', 'Item', b.item, { qty, reason: b.reason });
  return ok({ wastage: w });
}
