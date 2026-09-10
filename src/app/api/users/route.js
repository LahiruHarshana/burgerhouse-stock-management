import { User, Audit } from '@/models';
import { guard, ok, badKey, body, log } from '@/lib/api';
import { CAN, hash } from '@/lib/auth';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function GET() {
  const g = await guard({ can: CAN.approve });
  if (g.error) return g.error;
  const [users, audit] = await Promise.all([
    User.find().select('-passwordHash').sort({ createdAt: 1 }).lean(),
    Audit.find().sort({ at: -1 }).limit(60).lean(),
  ]);
  return ok({ users, audit });
}

export async function POST(req) {
  const g = await guard({ can: CAN.admin });
  if (g.error) return g.error;
  const b = await body(req);
  if (!b.name?.trim() || !b.username?.trim()) return badKey(g.locale, 'errors.userFieldsRequired');
  if ((b.password || '').length < 6) return badKey(g.locale, 'errors.passwordMin');
  const username = b.username.trim().toLowerCase();
  if (await User.exists({ username })) return badKey(g.locale, 'errors.usernameTaken');
  const u = await User.create({
    name: b.name.trim(), username, passwordHash: await hash(b.password),
    role: b.role || 'VIEWER',
  });
  await log(g.user, 'CREATE', 'User', u._id, { username, role: u.role });
  return ok({ user: { _id: u._id, name: u.name, username: u.username, role: u.role } });
}
