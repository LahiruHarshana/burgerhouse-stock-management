import { Item, StockLevel } from '@/models';
import { guard, ok, badKey, body, log } from '@/lib/api';
import { CAN } from '@/lib/auth';
import { levelsFor } from '@/lib/stock';
import { clean } from '@/lib/itemClean';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
/** GET /api/items?q=&category=&state=low|out&limit=&page= */
export async function GET(req) {
  const g = await guard({ module: 'items' });
  if (g.error) return g.error;

  const s = new URL(req.url).searchParams;
  const q = (s.get('q') || '').trim();
  const limit = Math.min(Number(s.get('limit')) || 50, 200);
  const page = Math.max(Number(s.get('page')) || 1, 1);

  const filter = { active: s.get('all') === '1' ? { $in: [true, false] } : true };
  if (s.get('category')) filter.category = s.get('category');
  if (s.get('beverage') === '1') filter['beverage.isBeverage'] = true;
  if (q) {
    // regex එකට වඩා prefix search එක index එකෙන් වේගවත්
    filter.$or = [
      { code: new RegExp('^' + esc(q), 'i') },
      { name: new RegExp(esc(q), 'i') },
      { nameSi: new RegExp(esc(q), 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    Item.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit)
      .populate('category', 'name').lean(),
    Item.countDocuments(filter),
  ]);

  const levels = g.enabled.includes('stock') ? await levelsFor(items.map((i) => i._id)) : {};
  let out = items.map((i) => ({ ...i, qty: levels[i._id] || 0 }));

  const state = s.get('state');
  if (state === 'out') out = out.filter((i) => i.qty <= 0);
  if (state === 'low') out = out.filter((i) => i.reorderLevel > 0 && i.qty > 0 && i.qty <= i.reorderLevel);

  return ok({ items: out, total, page, limit });
}

export async function POST(req) {
  const g = await guard({ module: 'items', can: CAN.stock });
  if (g.error) return g.error;
  const b = await body(req);
  if (!b.code?.trim() || !b.name?.trim()) return badKey(g.locale, 'errors.itemCodeNameRequired');

  if (await Item.exists({ code: b.code.trim().toUpperCase() })) {
    return badKey(g.locale, 'errors.categoryExists');
  }

  const item = await Item.create(clean(b));

  // ආරම්භක තොගයක් දුන්නානම් ඒක ගහනවා
  if (Number(b.openingQty) > 0 && b.defaultLocation) {
    const { moveStock } = await import('@/lib/stock');
    await moveStock({
      item: item._id, location: b.defaultLocation, qty: Number(b.openingQty),
      cost: Number(b.costPerUnit) || 0, reason: 'OPENING', user: g.user, note: 'Item එක හදනකොට',
    });
  }
  await log(g.user, 'CREATE', 'Item', item._id, { code: item.code, name: item.name });
  return ok({ item });
}

function esc(t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
