import { User } from '@/models';
import { guard, ok, badKey, body, log } from '@/lib/api';
import { CAN, hash } from '@/lib/auth';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function PUT(req, { params }) {
  const g = await guard({ can: CAN.admin });
  if (g.error) return g.error;
  const b = await body(req);
  const patch = {};
  if (b.name?.trim()) patch.name = b.name.trim();
  if (b.role) patch.role = b.role;
  if (typeof b.active === 'boolean') patch.active = b.active;
  if (b.password) {
    if (b.password.length < 6) return badKey(g.locale, 'errors.passwordMin');
    patch.passwordHash = await hash(b.password);
  }
  if (String(params.id) === String(g.user.id) && (patch.active === false || (patch.role && patch.role !== 'OWNER'))) {
    return badKey(g.locale, 'errors.cannotDisableSelf');
  }
  await User.updateOne({ _id: params.id }, { $set: patch });
  await log(g.user, 'UPDATE', 'User', params.id, { ...patch, passwordHash: undefined });
  return ok();
}
