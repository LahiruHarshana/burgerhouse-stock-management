import { Movement } from '@/models';
import { guard, ok } from '@/lib/api';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function GET(req) {
  const g = await guard({ module: 'stock' });
  if (g.error) return g.error;
  const s = new URL(req.url).searchParams;
  const q = {};
  if (s.get('item')) q.item = s.get('item');
  if (s.get('reason')) q.reason = s.get('reason');
  if (s.get('from') || s.get('to')) {
    q.at = {};
    if (s.get('from')) q.at.$gte = new Date(s.get('from'));
    if (s.get('to')) q.at.$lte = new Date(s.get('to') + 'T23:59:59');
  }
  const rows = await Movement.find(q).sort({ at: -1 }).limit(Math.min(Number(s.get('limit')) || 100, 500))
    .populate('item', 'name code unit').populate('location', 'name').lean();
  return ok({ rows });
}
