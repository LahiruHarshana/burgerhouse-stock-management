import { GRN, PurchaseOrder, Supplier, Item, Location } from '@/models';
import { guard, ok, badKey, body, log } from '@/lib/api';
import { CAN } from '@/lib/auth';
import { moveStock } from '@/lib/stock';
import { nextRef } from '@/lib/ref';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function GET(req) {
  const g = await guard({ module: 'purchasing' });
  if (g.error) return g.error;
  return ok({ grns: await GRN.find().sort({ receivedAt: -1 }).limit(100).lean() });
}

/**
 * බඩු ලැබීම. මෙතනදි තමයි තොගය වැඩි වෙන්නෙත් cost එක අලුත් වෙන්නෙත්.
 * Landed cost: ප්‍රවාහන ගාස්තුව line වල වටිනාකමට අනුව බෙදනවා.
 */
export async function POST(req) {
  const g = await guard({ module: 'purchasing', can: CAN.stock });
  if (g.error) return g.error;
  const b = await body(req);
  const lines = (b.lines || []).filter((l) => l.item && Number(l.qty) > 0);
  if (!lines.length) return badKey(g.locale, 'errors.grnLinesRequired');

  let location = b.location;
  if (!location) location = (await Location.findOne({ active: true }).select('_id').lean())?._id;
  if (!location) return badKey(g.locale, 'errors.noStockLocation');

  const items = await Item.find({ _id: { $in: lines.map((l) => l.item) } }).select('name unit trackExpiry').lean();
  const map = Object.fromEntries(items.map((i) => [String(i._id), i]));

  const extra = Number(b.extraCost) || 0;
  const goods = lines.reduce((a, l) => a + Number(l.qty) * Number(l.price || 0), 0);

  const built = [];
  for (const l of lines) {
    const factor = Number(l.factor) || 1;
    const qty = Number(l.qty);
    const price = Number(l.price) || 0;
    const share = goods > 0 ? (qty * price / goods) * extra : 0;   // landed cost කොටස
    const baseQty = qty * factor;
    const unitCost = baseQty > 0 ? (qty * price + share) / baseQty : 0;

    built.push({
      item: l.item, itemName: map[l.item]?.name, unit: l.unit || map[l.item]?.unit,
      factor, qty, baseQty, price,
      batchNo: l.batchNo || '', expiry: l.expiry || null,
    });

    await moveStock({
      item: l.item, location, qty: baseQty, cost: unitCost, reason: 'GRN',
      refType: 'GRN', note: b.invoiceNo, user: g.user,
      batchNo: l.batchNo, expiry: l.expiry ? new Date(l.expiry) : null,
    });
  }

  const sup = b.supplier ? await Supplier.findById(b.supplier).select('name').lean() : null;
  const grn = await GRN.create({
    grnNo: await nextRef(GRN, 'grnNo', 'GRN'),
    po: b.po || undefined, poNo: b.poNo, supplier: b.supplier || undefined, supplierName: sup?.name,
    location, invoiceNo: b.invoiceNo, receivedAt: b.receivedAt || new Date(),
    lines: built, extraCost: extra, total: goods + extra,
    createdBy: g.user.id, createdByName: g.user.name,
  });

  // PO එකේ ලැබුණු ප්‍රමාණය අලුත් කිරීම
  if (b.po) {
    const po = await PurchaseOrder.findById(b.po);
    if (po) {
      for (const l of built) {
        const pl = po.lines.find((x) => String(x.item) === String(l.item));
        if (pl) pl.receivedQty += l.qty;
      }
      const done = po.lines.every((x) => x.receivedQty >= x.qty);
      po.status = done ? 'RECEIVED' : 'PARTIAL';
      await po.save();
    }
  }

  await log(g.user, 'CREATE', 'GRN', grn._id, { grnNo: grn.grnNo, total: grn.total });
  return ok({ grn });
}
