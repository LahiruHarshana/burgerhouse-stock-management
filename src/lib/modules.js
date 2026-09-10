/**
 * System එකේ හදවත.
 * Admin කැමති module ටික විතරක් on කරනවා. Off කරපු module එකක්:
 *   - Sidebar එකේ පේන්නේ නෑ
 *   - ඒකේ page එකට යන්න බෑ
 *   - ඒකේ API එක 403 දෙනවා
 * `requires` කියන්නේ dependency එක. Recipes ඕනනම් Items අනිවාර්යයි.
 */
export const MODULES = [
  { key: 'items', no: 1, requires: [], locked: true, href: '/items', icon: 'box',
    name: 'Items & Ingredients', si: 'අයිතම හා අමුද්‍රව්‍ය',
    blurb: 'මුළු system එකේම පදනම. හැම දෙයක්ම මෙතනින් පටන් ගන්නවා.' },

  { key: 'recipes', no: 2, requires: ['items'], href: '/recipes', icon: 'book',
    name: 'Recipes', si: 'වට්ටෝරු',
    blurb: 'බර්ගර් එකකට යන bun, patty, cheese ලියලා තියෙනවා. විකුණපුවම ඒවා ඉබේම අඩු වෙනවා.' },

  { key: 'purchasing', no: 3, requires: ['items'], href: '/purchasing', icon: 'truck',
    name: 'Purchasing', si: 'මිලදී ගැනීම්',
    blurb: 'Supplier ලා, order, බඩු ආවම ලියාපදිංචිය (GRN), මිල ගණන් වෙනස් වීම.' },

  { key: 'stock', no: 4, requires: ['items'], href: '/stock', icon: 'layers',
    name: 'Stock Control', si: 'තොග පාලනය',
    blurb: 'දැන් තියෙන තොගය, තැනින් තැනට යැවීම, expiry date, අඩු වුණාම දැනුම් දීම.' },

  { key: 'wastage', no: 5, requires: ['items', 'stock'], href: '/wastage', icon: 'trash',
    name: 'Wastage', si: 'නාස්තිය',
    blurb: 'පිච්චුණු, පල් වුණු, බිමට වැටුණු ඒවා ලියලා තියෙනවා. මාසෙට කීයක් නාස්තිද කියලා පේනවා.' },

  { key: 'stocktake', no: 6, requires: ['items', 'stock'], href: '/stocktake', icon: 'clipboard',
    name: 'Stocktake', si: 'තොග ගණන් කිරීම',
    blurb: 'අතින් ගණන් කරලා system එකට ගහනවා. පරතරයක් තියෙනවනම් වහාම පේනවා.' },

  { key: 'beverage', no: 7, requires: ['items'], href: '/beverages', icon: 'cup',
    name: 'Beverages', si: 'බීම වර්ග',
    blurb: 'බෝතල්, කෑන්, keg. බෝතලයක් කැඩුවම ml ගානට අඩු වීම, හිස් බෝතල් ආපහු දීම.' },

  { key: 'costing', no: 8, requires: ['items', 'stock'], href: '/costing', icon: 'coin',
    name: 'Costing', si: 'පිරිවැය',
    blurb: 'තොගයේ වටිනාකම, COGS, එක බර්ගර් එකක සැබෑ පිරිවැය සහ ලාභය.' },

  { key: 'sales', no: 9, requires: ['items', 'recipes', 'stock'], href: '/sales', icon: 'receipt',
    name: 'Sales', si: 'විකුණුම්',
    blurb: 'විකුණුම් ගහනවා (හෝ පිටතින් API එකෙන් එවනවා), recipe එකට අනුව තොගය ඉබේ අඩු වෙනවා.' },

  { key: 'reports', no: 10, requires: ['items'], href: '/reports', icon: 'chart',
    name: 'Reports', si: 'වාර්තා',
    blurb: 'පාවිච්චිය, වේගයෙන් යන/නොයන බඩු, food cost %, Excel එකට download.' },

  { key: 'users', no: 11, requires: [], locked: true, href: '/users', icon: 'users',
    name: 'Users & Security', si: 'පරිශීලකයන්',
    blurb: 'කාට මොනවද කරන්න පුළුවන් කියලා තීරණය කිරීම සහ කවුද මොනවද කලේ කියන ලොග් එක.' },

  { key: 'multibranch', no: 12, requires: ['items'], href: '/branches', icon: 'pin',
    name: 'Branches', si: 'ශාඛා',
    blurb: 'ශාඛා එකකට වඩා තියෙනවනම් හෝ store / kitchen / bar වෙන වෙනම බලනවනම්.' },
];

export const MODULE_MAP = Object.fromEntries(MODULES.map((m) => [m.key, m]));

/** හැමවිටම on වෙන module (off කරන්න බෑ) */
export const LOCKED = MODULES.filter((m) => m.locked).map((m) => m.key);

/**
 * Admin තෝරපු list එක පිරිසිදු කරනවා:
 *  - locked ඒවා අනිවාර්යයෙන් ඇතුළත් කරනවා
 *  - dependency නැති ඒවා අයින් කරනවා (Recipes on කරලා Items off කරන්න බෑ)
 */
export function resolveEnabled(selected = []) {
  const set = new Set([...LOCKED, ...selected]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const key of [...set]) {
      const mod = MODULE_MAP[key];
      if (!mod) { set.delete(key); changed = true; continue; }
      if (mod.requires.some((r) => !set.has(r))) { set.delete(key); changed = true; }
    }
  }
  return MODULES.filter((m) => set.has(m.key)).map((m) => m.key);
}

/** module එකක් off කලොත් ඒක නිසා off වෙන අනිත් ඒවා මොනවද */
export function dependentsOf(key) {
  return MODULES.filter((m) => m.requires.includes(key)).map((m) => m.key);
}
