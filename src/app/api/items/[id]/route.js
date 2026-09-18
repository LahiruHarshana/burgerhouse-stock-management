import { Item, StockLevel, Movement } from '@/models';
import { guard, ok, badKey, body, log } from '@/lib/api';
import { CAN } from '@/lib/auth';
import { clean } from '@/lib/itemClean';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function GET(req, { params }) {
  const g = await guard({ module: 'items' });
  if (g.error) return g.error;
  const item = await Item.findById(params.id).populate('category', 'name').lean();
  if (!item) return badKey(g.locale, 'errors.notFound', 404);

  const [levels, history] = await Promise.all([
    StockLevel.find({ item: params.id }).populate('location', 'name type').lean(),
    g.enabled.includes('stock')
      ? Movement.find({ item: params.id }).sort({ at: -1 }).limit(30).populate('location', 'name').lean()
      : [],
  ]);
  return ok({ item, levels, history });
}

export async function PUT(req, { params }) {
  const g = await guard({ module: 'items', can: CAN.stock });
  if (g.error) return g.error;
  const b = await body(req);
  const patch = clean(b);
  delete patch.code; // code එක වෙනස් කරන්න දෙන්නේ නෑ — history එක බිඳෙනවා
  const item = await Item.findByIdAndUpdate(params.id, { $set: patch }, { new: true });
  if (!item) return badKey(g.locale, 'errors.notFound', 404);

  if (g.enabled.includes('stock') && patch.costPerUnit != null) {
    const levels = await StockLevel.find({ item: params.id });
    for (const lv of levels) {
      lv.value = lv.qty * patch.costPerUnit;
      await lv.save();
    }
  }

  await log(g.user, 'UPDATE', 'Item', item._id, { name: item.name, costPerUnit: patch.costPerUnit });
  return ok({ item });
}

export async function DELETE(req, { params }) {
  const g = await guard({ module: 'items', can: CAN.approve });
  if (g.error) return g.error;
  // මකන්නේ නෑ — deactivate කරනවා. History එක ආරක්ෂා වෙනවා.
  await Item.updateOne({ _id: params.id }, { $set: { active: false } });
  await log(g.user, 'DEACTIVATE', 'Item', params.id);
  return ok();
}
