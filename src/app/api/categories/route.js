import { Category } from '@/models';
import { guard, ok, badKey, body } from '@/lib/api';
import { CAN } from '@/lib/auth';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function GET() {
  const g = await guard({ module: 'items' });
  if (g.error) return g.error;
  return ok({ categories: await Category.find().sort({ sort: 1, name: 1 }).lean() });
}
export async function POST(req) {
  const g = await guard({ module: 'items', can: CAN.stock });
  if (g.error) return g.error;
  const b = await body(req);
  if (!b.name?.trim()) return badKey(g.locale, 'errors.nameRequired');
  if (await Category.exists({ name: b.name.trim() })) return badKey(g.locale, 'errors.categoryExists');
  return ok({ category: await Category.create({ name: b.name.trim(), kind: b.kind || 'FOOD' }) });
}
