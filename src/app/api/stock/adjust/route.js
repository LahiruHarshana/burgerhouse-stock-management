import { guard, ok, bad, badKey, body, log, translateStockError } from '@/lib/api';
import { CAN } from '@/lib/auth';
import { moveStock } from '@/lib/stock';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
/** අතින් තොගය නිවැරදි කිරීම — manager අවසරය ඕන */
export async function POST(req) {
  const g = await guard({ module: 'stock', can: CAN.approve });
  if (g.error) return g.error;
  const b = await body(req);
  if (!b.item || !b.location || !b.qty) return badKey(g.locale, 'errors.adjustFieldsRequired');
  if (!b.note?.trim()) return badKey(g.locale, 'errors.adjustNoteRequired');
  try {
    const r = await moveStock({
      item: b.item, location: b.location, qty: Number(b.qty),
      reason: 'ADJUSTMENT', note: b.note.trim(), user: g.user,
    });
    await log(g.user, 'ADJUST', 'Item', b.item, { qty: b.qty, note: b.note });
    return ok({ balance: r.balance });
  } catch (e) { return bad(translateStockError(g.locale, e)); }
}
