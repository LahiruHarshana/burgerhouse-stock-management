import { Recipe, Item } from '@/models';

/**
 * වට්ටෝරුවක පිරිවැය ගණනය කිරීම.
 * Sub-recipe (sauce වගේ) තියෙනවනම් ඒවත් ඇතුළට ගණන් ගන්නවා.
 * ගණන් කරලා recipe එකේම save කරනවා -> report ලෝඩ් වෙනකොට ආපහු ගණන් කරන්නේ නෑ.
 */
export async function recipeCost(recipeId, save = false, depth = 0, seen = new Set()) {
  if (depth > 5 || seen.has(String(recipeId))) return 0;   // රවුමක් හැදුණොත් නවත්තනවා
  seen.add(String(recipeId));

  const r = await Recipe.findById(recipeId).lean();
  if (!r) return 0;

  const itemIds = r.lines.filter((l) => l.item).map((l) => l.item);
  const items = await Item.find({ _id: { $in: itemIds } }).select('costPerUnit yieldPct').lean();
  const map = Object.fromEntries(items.map((i) => [String(i._id), i]));

  let total = 0;
  for (const l of r.lines) {
    if (l.item) {
      const it = map[String(l.item)];
      if (!it) continue;
      // yield එක 85% නම්, ඇත්තටම කපන්න ඕන 100/85 ගුණයක්
      const factor = 100 / (it.yieldPct || 100);
      total += (it.costPerUnit || 0) * l.qty * factor;
    } else if (l.subRecipe) {
      const sub = await Recipe.findById(l.subRecipe).select('yieldQty').lean();
      const subCost = await recipeCost(l.subRecipe, false, depth + 1, seen);
      total += (subCost / (sub?.yieldQty || 1)) * l.qty;
    }
  }

  if (save) {
    await Recipe.updateOne({ _id: recipeId }, { $set: { cachedCost: total, costUpdatedAt: new Date() } });
  }
  return total;
}

/** Recipe එකක් අනුව අමුද්‍රව්‍ය ලැයිස්තුවක් (තොගයෙන් අඩු කරන්න) */
export async function explode(recipeId, qty = 1, depth = 0, out = []) {
  if (depth > 5) return out;
  const r = await Recipe.findById(recipeId).lean();
  if (!r) return out;
  const per = qty / (r.yieldQty || 1);
  for (const l of r.lines) {
    if (l.item) out.push({ item: l.item, qty: l.qty * per });
    else if (l.subRecipe) await explode(l.subRecipe, l.qty * per, depth + 1, out);
  }
  return out;
}
