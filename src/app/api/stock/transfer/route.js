import { guard, ok, bad, badKey, body, log, translateStockError } from '@/lib/api';
import { CAN } from '@/lib/auth';
import { moveStock } from '@/lib/stock';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
/** ගබඩාවෙන් කුස්සියට / bar එකට යැවීම */
export async function POST(req) {
  const g = await guard({ module: 'stock', can: CAN.stock });
  if (g.error) return g.error;
  const b = await body(req);
  const qty = Number(b.qty);
  if (!b.item || !b.from || !b.to || !(qty > 0)) return badKey(g.locale, 'errors.transferFieldsRequired');
  if (b.from === b.to) return badKey(g.locale, 'errors.sameLocation');
  try {
    await moveStock({ item: b.item, location: b.from, qty: -qty, reason: 'TRANSFER_OUT', note: b.note, user: g.user, allowNegative: false });
    await moveStock({ item: b.item, location: b.to, qty, reason: 'TRANSFER_IN', note: b.note, user: g.user });
    await log(g.user, 'TRANSFER', 'Item', b.item, { qty, from: b.from, to: b.to });
    return ok();
  } catch (e) { return bad(translateStockError(g.locale, e)); }
}
