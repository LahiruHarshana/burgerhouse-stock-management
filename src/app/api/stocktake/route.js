import { Stocktake, Item, Location, StockLevel } from '@/models';
import { guard, ok, badKey, body, log } from '@/lib/api';
import { CAN } from '@/lib/auth';
import { nextRef } from '@/lib/ref';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function GET() {
  const g = await guard({ module: 'stocktake' });
  if (g.error) return g.error;
  return ok({ sheets: await Stocktake.find().sort({ createdAt: -1 }).limit(50).select('-lines').lean() });
}

/** ගණන් කරන්න sheet එකක් හදනවා — දැන් තියෙන තොගය system qty විදිහට ලියලා */
export async function POST(req) {
  const g = await guard({ module: 'stocktake', can: CAN.record });
  if (g.error) return g.error;
  const b = await body(req);
  const location = b.location || (await Location.findOne({ active: true }).select('_id name').lean())?._id;
  if (!location) return badKey(g.locale, 'errors.locationRequired');

  const loc = await Location.findById(location).select('name').lean();
  const filter = { active: true };
  if (b.category) filter.category = b.category;
  const items = await Item.find(filter).select('name code unit costPerUnit').sort({ name: 1 }).lean();
  if (!items.length) return badKey(g.locale, 'errors.noCountItems');

  const levels = await StockLevel.find({ location, item: { $in: items.map((i) => i._id) } }).select('item qty').lean();
  const lmap = Object.fromEntries(levels.map((l) => [String(l.item), l.qty]));

  const sheet = await Stocktake.create({
    ref: await nextRef(Stocktake, 'ref', 'ST'),
    location, locationName: loc?.name, status: 'OPEN',
    lines: items.map((i) => ({
      item: i._id, itemName: i.name, itemCode: i.code, unit: i.unit,
      systemQty: lmap[String(i._id)] || 0, countedQty: null, cost: i.costPerUnit || 0,
    })),
    countedBy: g.user.id, countedByName: g.user.name,
  });
  await log(g.user, 'CREATE', 'Stocktake', sheet._id, { ref: sheet.ref });
  return ok({ sheet: { _id: sheet._id, ref: sheet.ref } });
}
