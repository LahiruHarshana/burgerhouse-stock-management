import { Supplier, GRN } from '@/models';
import { guard, ok, badKey, body } from '@/lib/api';
import { CAN } from '@/lib/auth';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function GET(req, { params }) {
  const g = await guard({ module: 'purchasing' });
  if (g.error) return g.error;
  const supplier = await Supplier.findById(params.id).lean();
  if (!supplier) return badKey(g.locale, 'errors.notFound', 404);
  const grns = await GRN.find({ supplier: params.id }).sort({ receivedAt: -1 }).limit(20).lean();
  return ok({ supplier, grns });
}
export async function PUT(req, { params }) {
  const g = await guard({ module: 'purchasing', can: CAN.stock });
  if (g.error) return g.error;
  const b = await body(req);
  const s = await Supplier.findByIdAndUpdate(params.id, {
    $set: { name: b.name?.trim(), phone: b.phone, email: b.email, address: b.address,
      paymentTermsDays: Number(b.paymentTermsDays) || 0, leadTimeDays: Number(b.leadTimeDays) || 1,
      active: b.active !== false },
  }, { new: true });
  return ok({ supplier: s });
}
