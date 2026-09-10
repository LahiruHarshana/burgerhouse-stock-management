import { PurchaseOrder } from '@/models';
import { guard, ok, badKey, body, log } from '@/lib/api';
import { CAN } from '@/lib/auth';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function GET(req, { params }) {
  const g = await guard({ module: 'purchasing' });
  if (g.error) return g.error;
  const po = await PurchaseOrder.findById(params.id).lean();
  return po ? ok({ po }) : badKey(g.locale, 'errors.notFound', 404);
}
export async function PUT(req, { params }) {
  const g = await guard({ module: 'purchasing', can: CAN.stock });
  if (g.error) return g.error;
  const b = await body(req);
  const allowed = ['DRAFT', 'SENT', 'CANCELLED'];
  if (!allowed.includes(b.status)) return badKey(g.locale, 'errors.invalidStatus');
  const po = await PurchaseOrder.findByIdAndUpdate(params.id, { $set: { status: b.status } }, { new: true });
  await log(g.user, 'UPDATE', 'PurchaseOrder', params.id, { status: b.status });
  return ok({ po });
}
