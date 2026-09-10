import { Sale, Recipe, Location, Settings } from '@/models';
import { guard, ok, badKey, body, log, getSettings } from '@/lib/api';
import { CAN } from '@/lib/auth';
import { db } from '@/lib/db';
import { moveStock } from '@/lib/stock';
import { explode, recipeCost } from '@/lib/recipe';
import { nextRef } from '@/lib/ref';
import { DEFAULT_LOCALE } from '@/lib/i18n';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function GET(req) {
  const g = await guard({ module: 'sales' });
  if (g.error) return g.error;
  const s = new URL(req.url).searchParams;
  const q = {};
  if (s.get('from')) q.at = { $gte: new Date(s.get('from')) };
  if (s.get('to')) q.at = { ...(q.at || {}), $lte: new Date(s.get('to') + 'T23:59:59') };
  const rows = await Sale.find(q).sort({ at: -1 }).limit(100).lean();
  const totals = rows.reduce((a, r) => ({ sales: a.sales + r.total, cost: a.cost + r.totalCost }), { sales: 0, cost: 0 });
  return ok({ rows, totals });
}

/**
 * විකුණුමක් ගහනවා -> recipe එකට අනුව අමුද්‍රව්‍ය ඉබේම අඩු වෙනවා.
 * පිටත POS එකකින් එවනවනම් header එකේ x-api-key එක යවන්න (Settings වල තියෙනවා).
 */
export async function POST(req) {
  const key = req.headers.get('x-api-key');
  let user = null;
  let locale = DEFAULT_LOCALE;

  if (key) {
    await db();
    const st = await getSettings();
    if (!st.apiKey || key !== st.apiKey) return badKey(locale, 'errors.invalidApiKey', 401);
    user = { id: null, name: 'POS' };
  } else {
    const g = await guard({ module: 'sales', can: CAN.record });
    if (g.error) return g.error;
    user = g.user;
    locale = g.locale;
  }

  const b = await body(req);
  const lines = (b.lines || []).filter((l) => l.recipe && Number(l.qty) > 0);
  if (!lines.length) return badKey(locale, 'errors.saleLinesRequired');

  const location = b.location || (await Location.findOne({ active: true }).select('_id').lean())?._id;
  const built = []; let total = 0, totalCost = 0;

  for (const l of lines) {
    const r = await Recipe.findById(l.recipe).select('name sellPrice cachedCost yieldQty').lean();
    if (!r) continue;
    const qty = Number(l.qty);
    const price = l.price != null ? Number(l.price) : (r.sellPrice || 0);
    const cost = (r.cachedCost || await recipeCost(l.recipe)) / (r.yieldQty || 1);

    const needs = await explode(l.recipe, qty);
    for (const nd of needs) {
      // තොගය මයිනස් වුණත් විකුණුම නවත්තන්නේ නෑ — ඒත් movement එකේ ලියැවෙනවා
      await moveStock({ item: nd.item, location, qty: -nd.qty, reason: 'SALE', refType: 'Sale', user });
    }
    built.push({ recipe: r._id, name: r.name, qty, price, cost });
    total += price * qty; totalCost += cost * qty;
  }
  if (!built.length) return badKey(locale, 'errors.noValidRecipes');

  let source = 'MANUAL';
  if (key) source = b.source || 'API';
  else if (b.source === 'TERMINAL') source = 'TERMINAL';

  const PAY = new Set(['CASH', 'CARD']);
  const paymentMethod = PAY.has(b.paymentMethod) ? b.paymentMethod : undefined;
  const SVC = new Set(['DINE_IN', 'TAKEAWAY']);
  const serviceType = SVC.has(b.serviceType) ? b.serviceType : undefined;

  const sale = await Sale.create({
    ref: b.ref || await nextRef(Sale, 'ref', 'SL'),
    source,
    location, lines: built, total, totalCost,
    ...(paymentMethod ? { paymentMethod } : {}),
    ...(serviceType ? { serviceType } : {}),
    at: b.at || new Date(), user: user?.id, userName: user?.name,
  });
  return ok({
    sale: {
      _id: sale._id,
      ref: sale.ref,
      at: sale.at,
      source: sale.source,
      lines: built.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
      total: sale.total,
      totalCost: sale.totalCost,
      userName: sale.userName,
      paymentMethod: sale.paymentMethod,
      serviceType: sale.serviceType,
      location: sale.location,
    },
  });
}
