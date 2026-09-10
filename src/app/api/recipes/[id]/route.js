import { Recipe } from '@/models';
import { guard, ok, badKey, body, log } from '@/lib/api';
import { CAN } from '@/lib/auth';
import { recipeCost } from '@/lib/recipe';
import { POS_CATEGORIES } from '@/lib/pos';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function GET(req, { params }) {
  const g = await guard({ module: 'recipes' });
  if (g.error) return g.error;
  const recipe = await Recipe.findById(params.id)
    .populate('lines.item', 'name nameSi unit costPerUnit code')
    .populate('lines.subRecipe', 'name code cachedCost yieldQty')
    .populate('modifiers.item', 'name unit costPerUnit').lean();
  if (!recipe) return badKey(g.locale, 'errors.notFound', 404);
  const cost = await recipeCost(params.id);
  return ok({ recipe, cost });
}

export async function PUT(req, { params }) {
  const g = await guard({ module: 'recipes', can: CAN.stock });
  if (g.error) return g.error;
  const b = await body(req);
  const lines = (b.lines || []).filter((l) => (l.item || l.subRecipe) && Number(l.qty) > 0);
  if (!lines.length) return badKey(g.locale, 'errors.recipeLinesRequired');
  await Recipe.updateOne({ _id: params.id }, { $set: {
    name: b.name?.trim(), nameSi: b.nameSi || '', yieldQty: Number(b.yieldQty) || 1,
    sellPrice: Number(b.sellPrice) || 0, active: b.active !== false,
    posCategory: POS_CATEGORIES.includes(b.posCategory) ? b.posCategory : undefined,
    lines: lines.map((l) => ({ item: l.item || undefined, subRecipe: l.subRecipe || undefined, qty: Number(l.qty), note: l.note })),
    modifiers: (b.modifiers || []).filter((m) => m.name).map((m) => ({
      name: m.name, item: m.item || undefined, qty: Number(m.qty) || 0, extraPrice: Number(m.extraPrice) || 0 })),
  } });
  await recipeCost(params.id, true);
  await log(g.user, 'UPDATE', 'Recipe', params.id);
  return ok();
}

export async function DELETE(req, { params }) {
  const g = await guard({ module: 'recipes', can: CAN.approve });
  if (g.error) return g.error;
  await Recipe.updateOne({ _id: params.id }, { $set: { active: false } });
  return ok();
}
