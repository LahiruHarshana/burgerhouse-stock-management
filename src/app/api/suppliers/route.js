import { Supplier } from '@/models';
import { guard, ok, badKey, body, log } from '@/lib/api';
import { CAN } from '@/lib/auth';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function GET(req) {
  const g = await guard({ module: 'purchasing' });
  if (g.error) return g.error;
  const q = (new URL(req.url).searchParams.get('q') || '').trim();
  const f = { active: true };
  if (q) f.$or = [{ name: new RegExp(q, 'i') }, { code: new RegExp('^' + q, 'i') }];
  return ok({ suppliers: await Supplier.find(f).sort({ name: 1 }).limit(200).lean() });
}

export async function POST(req) {
  const g = await guard({ module: 'purchasing', can: CAN.stock });
  if (g.error) return g.error;
  const b = await body(req);
  if (!b.name?.trim()) return badKey(g.locale, 'errors.supplierNameRequired');
  const code = (b.code || b.name.slice(0, 3)).trim().toUpperCase();
  if (await Supplier.exists({ code })) return badKey(g.locale, 'errors.categoryExists');
  const sup = await Supplier.create({
    code, name: b.name.trim(), phone: b.phone, email: b.email, address: b.address,
    paymentTermsDays: Number(b.paymentTermsDays) || 0, leadTimeDays: Number(b.leadTimeDays) || 1,
  });
  await log(g.user, 'CREATE', 'Supplier', sup._id, { name: sup.name });
  return ok({ supplier: sup });
}
