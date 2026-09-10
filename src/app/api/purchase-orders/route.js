import { PurchaseOrder, Supplier, Item } from '@/models';
import { guard, ok, badKey, body, log } from '@/lib/api';
import { CAN } from '@/lib/auth';
import { nextRef } from '@/lib/ref';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function GET(req) {
  const g = await guard({ module: 'purchasing' });
  if (g.error) return g.error;
  const s = new URL(req.url).searchParams;
  const f = {};
  if (s.get('status')) f.status = s.get('status');
  return ok({ pos: await PurchaseOrder.find(f).sort({ createdAt: -1 }).limit(100).lean() });
}

export async function POST(req) {
  const g = await guard({ module: 'purchasing', can: CAN.stock });
  if (g.error) return g.error;
  const b = await body(req);
  const lines = (b.lines || []).filter((l) => l.item && Number(l.qty) > 0);
  if (!b.supplier) return badKey(g.locale, 'errors.supplierRequired');
  if (!lines.length) return badKey(g.locale, 'errors.poLinesRequired');

  const [sup, items] = await Promise.all([
    Supplier.findById(b.supplier).select('name').lean(),
    Item.find({ _id: { $in: lines.map((l) => l.item) } }).select('name code unit').lean(),
  ]);
  const map = Object.fromEntries(items.map((i) => [String(i._id), i]));

  const built = lines.map((l) => ({
    item: l.item, itemName: map[l.item]?.name, itemCode: map[l.item]?.code,
    unit: l.unit || map[l.item]?.unit, factor: Number(l.factor) || 1,
    qty: Number(l.qty), price: Number(l.price) || 0, receivedQty: 0,
  }));
  const total = built.reduce((a, l) => a + l.qty * l.price, 0) + (Number(b.extraCost) || 0);

  const po = await PurchaseOrder.create({
    poNo: await nextRef(PurchaseOrder, 'poNo', 'PO'),
    supplier: b.supplier, supplierName: sup?.name, location: b.location || undefined,
    status: b.status === 'SENT' ? 'SENT' : 'DRAFT',
    expectedDate: b.expectedDate || undefined,
    lines: built, extraCost: Number(b.extraCost) || 0, total, note: b.note,
    createdBy: g.user.id,
  });
  await log(g.user, 'CREATE', 'PurchaseOrder', po._id, { poNo: po.poNo, total });
  return ok({ po });
}
