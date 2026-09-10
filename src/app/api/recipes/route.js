import { Recipe, Item } from '@/models';
import { guard, ok, badKey, body, log } from '@/lib/api';
import { CAN } from '@/lib/auth';
import { recipeCost } from '@/lib/recipe';
import { POS_CATEGORIES } from '@/lib/pos';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function GET(req) {
  const g = await guard({ module: 'recipes' });
  if (g.error) return g.error;
  const s = new URL(req.url).searchParams;
  const f = { active: true };
  if (s.get('kind')) f.kind = s.get('kind');
  const recipes = await Recipe.find(f).sort({ name: 1 }).limit(300).lean();
  return ok({ recipes });
}

export async function POST(req) {
  const g = await guard({ module: 'recipes', can: CAN.stock });
  if (g.error) return g.error;
  const b = await body(req);
  if (!b.name?.trim()) return badKey(g.locale, 'errors.recipeNameRequired');
  const lines = (b.lines || []).filter((l) => (l.item || l.subRecipe) && Number(l.qty) > 0);
  if (!lines.length) return badKey(g.locale, 'errors.recipeLinesRequired');

  const code = (b.code || b.name).trim().toUpperCase().replace(/\s+/g, '-').slice(0, 24);
  if (await Recipe.exists({ code })) return badKey(g.locale, 'errors.categoryExists');

  const recipe = await Recipe.create({
    code, name: b.name.trim(), nameSi: b.nameSi || '', kind: b.kind === 'SUB' ? 'SUB' : 'MENU',
    yieldQty: Number(b.yieldQty) || 1, producesItem: b.producesItem || undefined,
    lines: lines.map((l) => ({ item: l.item || undefined, subRecipe: l.subRecipe || undefined, qty: Number(l.qty), note: l.note })),
    modifiers: (b.modifiers || []).filter((m) => m.name).map((m) => ({
      name: m.name, item: m.item || undefined, qty: Number(m.qty) || 0, extraPrice: Number(m.extraPrice) || 0,
    })),
    sellPrice: Number(b.sellPrice) || 0,
    posCategory: POS_CATEGORIES.includes(b.posCategory) ? b.posCategory : undefined,
  });
  await recipeCost(recipe._id, true);
  await log(g.user, 'CREATE', 'Recipe', recipe._id, { name: recipe.name });
  return ok({ recipe });
}
