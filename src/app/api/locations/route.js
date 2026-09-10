import { Location } from '@/models';
import { guard, ok, badKey, body, log } from '@/lib/api';
import { CAN } from '@/lib/auth';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function GET() {
  const g = await guard();
  if (g.error) return g.error;
  return ok({ locations: await Location.find({ active: true }).sort({ branch: 1, name: 1 }).lean() });
}
export async function POST(req) {
  const g = await guard({ can: CAN.approve });
  if (g.error) return g.error;
  const b = await body(req);
  if (!b.name?.trim()) return badKey(g.locale, 'errors.nameRequired');
  const loc = await Location.create({
    name: b.name.trim(), type: b.type || 'MAIN_STORE', branch: (b.branch || 'Main').trim(),
  });
  await log(g.user, 'CREATE', 'Location', loc._id, { name: loc.name });
  return ok({ location: loc });
}
