export const POS_CATEGORIES = ['BURGERS', 'HOT_DOGS', 'SUBMARINES', 'SIDES', 'DRINKS', 'OTHER'];

const RULES = [
  ['BURGERS', /burger|බර්ගර්/i],
  ['HOT_DOGS', /hot\s*dog|හොට්\s*ඩොග්/i],
  ['SUBMARINES', /submarine|sub\b|සබ්/i],
  ['SIDES', /fries|chips|onion|nugget|side/i],
  ['DRINKS', /cola|soda|juice|drink|tea|coffee|water|shake|beer|බීම|කෝලා/i],
];

export function posCategoryOf(recipe) {
  const set = recipe?.posCategory;
  if (set && POS_CATEGORIES.includes(set)) return set;
  const n = `${recipe?.name || ''} ${recipe?.nameSi || ''} ${recipe?.code || ''}`;
  for (const [cat, re] of RULES) {
    if (re.test(n)) return cat;
  }
  return 'OTHER';
}
