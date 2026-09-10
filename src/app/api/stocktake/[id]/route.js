import { Stocktake } from '@/models';
import { guard, ok, badKey, body, log } from '@/lib/api';
import { CAN } from '@/lib/auth';
import { moveStock } from '@/lib/stock';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function GET(req, { params }) {
  const g = await guard({ module: 'stocktake' });
  if (g.error) return g.error;
  const sheet = await Stocktake.findById(params.id).lean();
  return sheet ? ok({ sheet }) : badKey(g.locale, 'errors.notFound', 404);
}

/** ගණන් කරපු ගණන් save කිරීම */
export async function PUT(req, { params }) {
  const g = await guard({ module: 'stocktake', can: CAN.record });
  if (g.error) return g.error;
  const b = await body(req);
  const sheet = await Stocktake.findById(params.id);
  if (!sheet) return badKey(g.locale, 'errors.notFound', 404);
  if (sheet.status === 'APPROVED') return badKey(g.locale, 'errors.invalidStatus');

  for (const [id, val] of Object.entries(b.counts || {})) {
    const line = sheet.lines.id(id) || sheet.lines.find((l) => String(l._id) === id);
    if (line) line.countedQty = val === '' || val == null ? null : Number(val);
  }
  sheet.varianceValue = sheet.lines.reduce(
    (a, l) => a + (l.countedQty == null ? 0 : (l.countedQty - l.systemQty) * (l.cost || 0)), 0);
  if (b.submit) sheet.status = 'SUBMITTED';
  await sheet.save();
  return ok({ varianceValue: sheet.varianceValue, status: sheet.status });
}

/** අනුමත කිරීම — මෙතනදි තමයි ඇත්ත තොගය system එකට යන්නේ */
export async function POST(req, { params }) {
  const g = await guard({ module: 'stocktake', can: CAN.approve });
  if (g.error) return g.error;
  const sheet = await Stocktake.findById(params.id);
  if (!sheet) return badKey(g.locale, 'errors.notFound', 404);
  if (sheet.status === 'APPROVED') return badKey(g.locale, 'errors.invalidStatus');

  let n = 0;
  for (const l of sheet.lines) {
    if (l.countedQty == null) continue;
    const diff = l.countedQty - l.systemQty;
    if (Math.abs(diff) < 0.0001) continue;
    await moveStock({
      item: l.item, location: sheet.location, qty: diff, reason: 'STOCKTAKE',
      refType: 'Stocktake', refId: sheet._id, note: `${sheet.ref} ගණන් කිරීම`, user: g.user,
    });
    n++;
  }
  sheet.status = 'APPROVED';
  sheet.approvedBy = g.user.id; sheet.approvedByName = g.user.name; sheet.approvedAt = new Date();
  await sheet.save();
  await log(g.user, 'APPROVE', 'Stocktake', sheet._id, { ref: sheet.ref, adjusted: n, value: sheet.varianceValue });
  return ok({ adjusted: n });
}
