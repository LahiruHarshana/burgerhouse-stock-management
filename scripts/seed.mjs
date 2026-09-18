/**
 * උදාහරණ දත්ත + menu වට්ටෝරු ටිකක් දාන script එකක්.
 * පාවිච්චිය:  npm run seed
 * (මුලින්ම browser එකෙන් setup එක ඉවර කරලා තියෙන්න ඕන)
 *
 * අයිතම/වට්ටෝරු code එක අනුව upsert කරනවා — දැනටමත් දත්ත තියෙනවනම් update වෙනවා.
 */
import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n').filter((l) => l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }),
);

await mongoose.connect(env.MONGODB_URI);
const db = mongoose.connection.db;

const cats = await db.collection('categories').find().toArray();
const cat = (n) => cats.find((c) => c.name === n)?._id;
const loc = (await db.collection('locations').findOne({}))?._id;
if (!loc) { console.error('මුලින්ම browser එකෙන් setup එක ඉවර කරන්න.'); process.exit(1); }

const items = [
  /* ── Core ingredients (existing) ── */
  { code: 'BUN-01', name: 'Sesame Burger Bun', nameSi: 'බර්ගර් බනිස්', unit: 'pcs', cost: 45, qty: 200, reorder: 80, category: 'Buns & Bakery' },
  { code: 'BEF-01', name: 'Beef Patty 120g', nameSi: 'හරක් මස් පැටී', unit: 'pcs', cost: 210, qty: 150, reorder: 60, category: 'Meat', expiry: true },
  { code: 'CHK-01', name: 'Chicken Breast', nameSi: 'කුකුල් මස්', unit: 'g', cost: 1.65, qty: 18000, reorder: 5000, category: 'Meat', expiry: true, yield: 82 },
  { code: 'CHE-01', name: 'Cheddar Slice', nameSi: 'චීස්', unit: 'pcs', cost: 38, qty: 120, reorder: 100, category: 'Dairy', expiry: true },
  { code: 'LET-01', name: 'Lettuce', nameSi: 'සලාද කොළ', unit: 'g', cost: 0.9, qty: 3200, reorder: 2000, category: 'Vegetables', expiry: true },
  { code: 'TOM-01', name: 'Tomato', nameSi: 'තක්කාලි', unit: 'g', cost: 0.62, qty: 4500, reorder: 2500, category: 'Vegetables' },
  { code: 'ONI-01', name: 'Onion', nameSi: 'ලූනු', unit: 'g', cost: 0.44, qty: 9000, reorder: 3000, category: 'Vegetables' },
  { code: 'MAY-01', name: 'Mayonnaise', nameSi: 'මයෝනීස්', unit: 'ml', cost: 1.35, qty: 4000, reorder: 1500, category: 'Sauces & Spices' },
  { code: 'KET-01', name: 'Tomato Ketchup', nameSi: 'තක්කාලි සෝස්', unit: 'ml', cost: 0.85, qty: 5000, reorder: 2000, category: 'Sauces & Spices' },
  { code: 'OIL-01', name: 'Frying Oil', nameSi: 'තෙල්', unit: 'ml', cost: 0.72, qty: 12000, reorder: 4000, category: 'Sauces & Spices' },
  { code: 'POT-01', name: 'Frozen Fries', nameSi: 'ෆ්‍රයිස්', unit: 'g', cost: 0.95, qty: 15000, reorder: 6000, category: 'Vegetables', expiry: true },
  { code: 'COK-33', name: 'Coca-Cola 330ml Can', nameSi: 'කොකා-කෝලා කෑන්', unit: 'pcs', cost: 130, qty: 96, reorder: 48, category: 'Beverages', bev: { container: 'CAN', size: 330 } },
  { code: 'WTR-50', name: 'Water Bottle 500ml', nameSi: 'වතුර බෝතලය', unit: 'pcs', cost: 55, qty: 120, reorder: 60, category: 'Beverages', bev: { container: 'BOTTLE', size: 500, deposit: 0 } },
  { code: 'BOX-01', name: 'Burger Box', nameSi: 'බර්ගර් පෙට්ටිය', unit: 'pcs', cost: 14, qty: 500, reorder: 200, category: 'Packaging', type: 'NONFOOD' },
  { code: 'NAP-01', name: 'Napkin', nameSi: 'ටිෂූ', unit: 'pcs', cost: 1.2, qty: 2000, reorder: 800, category: 'Packaging', type: 'NONFOOD' },

  /* ── Menu-specific ingredients (new) ── */
  { code: 'BEF-02', name: 'Premium Beef Patty 180g', nameSi: 'ප්‍රීමියම් හරක් මස් පැටී', unit: 'pcs', cost: 380, qty: 80, reorder: 40, category: 'Meat', expiry: true },
  { code: 'CHK-PAT-01', name: 'Seasoned Chicken Patty 120g', nameSi: 'හැඩැ ගත් කුකුල් පැටී', unit: 'pcs', cost: 185, qty: 120, reorder: 50, category: 'Meat', expiry: true },
  { code: 'CHK-CRISP-01', name: 'Crispy Chicken Fillet', nameSi: 'ක්‍රිස්පි කුකුල් ෆිලේ', unit: 'pcs', cost: 240, qty: 100, reorder: 45, category: 'Meat', expiry: true },
  { code: 'FSH-CRISP-01', name: 'Breaded Fish Fillet', nameSi: 'ක්‍රිස්පි මාළු ෆිලේ', unit: 'pcs', cost: 295, qty: 70, reorder: 30, category: 'Meat', expiry: true },
  { code: 'MUS-01', name: 'Fresh Mushroom', nameSi: 'නැවුම් මිණිමුළු', unit: 'g', cost: 2.8, qty: 4000, reorder: 1500, category: 'Vegetables', expiry: true },
  { code: 'CAP-01', name: 'Capsicum', nameSi: 'කැප්සිකම්', unit: 'g', cost: 1.4, qty: 3000, reorder: 1200, category: 'Vegetables' },
  { code: 'HER-01', name: 'Mixed Herbs', nameSi: 'කුළුබඩු මිශ්‍රණය', unit: 'g', cost: 6, qty: 500, reorder: 150, category: 'Sauces & Spices' },
  { code: 'DEV-SAU-01', name: 'Devilled Chili Paste', nameSi: 'දෙව් ගුඩම් මිරිස් පේස්ට්', unit: 'g', cost: 2.2, qty: 2000, reorder: 800, category: 'Sauces & Spices' },
  { code: 'SPC-SAU-01', name: 'Special Burger Sauce', nameSi: 'ස්පෙෂල් බර්ගර් සෝස්', unit: 'ml', cost: 1.6, qty: 3000, reorder: 1000, category: 'Sauces & Spices' },
  { code: 'VEG-PAT-01', name: 'Vegetable Patty', nameSi: 'එළවළු පැටී', unit: 'pcs', cost: 98, qty: 90, reorder: 40, category: 'Vegetables', expiry: true },
  { code: 'VEG-PAC-01', name: 'Vegetable Pachchi Patty', nameSi: 'එළවළු පච්චි පැටී', unit: 'pcs', cost: 112, qty: 80, reorder: 35, category: 'Vegetables', expiry: true },

  /* ── Hot Dogs & Submarines ── */
  { code: 'HOT-BUN-01', name: 'Hot Dog Bun', nameSi: 'හොට් ඩොග් බනිස්', unit: 'pcs', cost: 35, qty: 150, reorder: 60, category: 'Buns & Bakery' },
  { code: 'SUB-BUN-01', name: 'Submarine Roll', nameSi: 'සබ්මැරීන් බනිස්', unit: 'pcs', cost: 55, qty: 120, reorder: 50, category: 'Buns & Bakery' },
  { code: 'SAU-REG-01', name: 'Grilled Pork Sausage', nameSi: 'සොසේජ්', unit: 'pcs', cost: 95, qty: 100, reorder: 45, category: 'Meat', expiry: true },
  { code: 'SAU-CHK-01', name: 'Chicken Sausage', nameSi: 'කුකුල් සොසේජ්', unit: 'pcs', cost: 110, qty: 90, reorder: 40, category: 'Meat', expiry: true },
  { code: 'SAU-VEG-01', name: 'Vegetable Sausage', nameSi: 'එළවළු සොසේජ්', unit: 'pcs', cost: 85, qty: 80, reorder: 35, category: 'Vegetables', expiry: true },
  { code: 'MST-01', name: 'Mustard Sauce', nameSi: 'මස්ටර්ඩ් සෝස්', unit: 'ml', cost: 1.2, qty: 2000, reorder: 800, category: 'Sauces & Spices' },
  { code: 'EGG-01', name: 'Egg', nameSi: 'බිත්තර', unit: 'pcs', cost: 28, qty: 180, reorder: 72, category: 'Dairy', expiry: true },
  { code: 'CHK-STRIP-01', name: 'Crispy Chicken Strips', nameSi: 'ක්‍රිස්පි කුකුල් ස්ට්‍රිප්ස්', unit: 'pcs', cost: 175, qty: 90, reorder: 40, category: 'Meat', expiry: true },
  { code: 'PORK-FIL-01', name: 'Savory Pork Filling', nameSi: 'ඌරු මස් මිශ්‍රණය', unit: 'g', cost: 3.5, qty: 6000, reorder: 2000, category: 'Meat', expiry: true },
  { code: 'CRM-DRS-01', name: 'Creamy Dressing', nameSi: 'ක්‍රීම් සෝස්', unit: 'ml', cost: 1.4, qty: 2500, reorder: 900, category: 'Sauces & Spices' },
];

const ids = {};
for (const it of items) {
  const doc = {
    code: it.code, name: it.name, nameSi: it.nameSi, category: cat(it.category),
    type: it.type || 'RAW', unit: it.unit, purchaseUnits: [], yieldPct: it.yield || 100,
    reorderLevel: it.reorder, maxLevel: it.reorder * 4, defaultLocation: loc,
    costPerUnit: it.cost, lastPurchasePrice: it.cost, sellPrice: 0,
    trackExpiry: !!it.expiry, perishable: !!it.expiry,
    beverage: { isBeverage: !!it.bev, container: it.bev?.container || '', containerSize: it.bev?.size || 0, depositValue: it.bev?.deposit || 0 },
    notes: '', active: true, updatedAt: new Date(),
  };
  const hadItem = await db.collection('items').findOne({ code: it.code });
  const r = await db.collection('items').findOneAndUpdate(
    { code: it.code },
    { $set: doc, $setOnInsert: { createdAt: new Date() } },
    { upsert: true, returnDocument: 'after' },
  );
  const id = r?._id || (await db.collection('items').findOne({ code: it.code }))._id;
  ids[it.code] = id;

  const hadStock = await db.collection('stocklevels').findOne({ item: id, location: loc });
  await db.collection('stocklevels').updateOne(
    { item: id, location: loc },
    { $set: { qty: it.qty, value: it.qty * it.cost, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  if (!hadItem || !hadStock) {
    await db.collection('movements').insertOne({
      item: id, location: loc, qty: it.qty, unitCost: it.cost, balanceAfter: it.qty,
      reason: 'OPENING', note: 'Seed', at: new Date(),
    });
  }
}

/** Menu prices from Burger House menu (Rs.) */
const recipes = [
  {
    code: 'CHICKEN-BURGER',
    name: 'Chicken Burger',
    nameSi: 'කුකුල් බර්ගර්',
    price: 1650,
    posCategory: 'BURGERS',
    lines: [['BUN-01', 1], ['CHK-PAT-01', 1], ['CHE-01', 1], ['LET-01', 15], ['TOM-01', 20], ['MAY-01', 12], ['BOX-01', 1], ['NAP-01', 2]],
  },
  {
    code: 'DEVILLED-CHICKEN',
    name: 'Devilled Chicken Burger',
    nameSi: 'දෙව් ගුඩම් කුකුල් බර්ගර්',
    price: 1350,
    posCategory: 'BURGERS',
    lines: [['BUN-01', 1], ['CHK-PAT-01', 1], ['DEV-SAU-01', 30], ['ONI-01', 15], ['CAP-01', 15], ['CHE-01', 1], ['BOX-01', 1], ['NAP-01', 2]],
  },
  {
    code: 'CRISPY-CHICKEN',
    name: 'Crispy Chicken Burger',
    nameSi: 'ක්‍රිස්පි කුකුල් බර්ගර්',
    price: 1300,
    posCategory: 'BURGERS',
    lines: [['BUN-01', 1], ['CHK-CRISP-01', 1], ['CHE-01', 1], ['SPC-SAU-01', 15], ['LET-01', 10], ['BOX-01', 1], ['NAP-01', 2]],
  },
  {
    code: 'MUSHROOM-BURGER',
    name: 'Mushroom Burger',
    nameSi: 'මිණිමුළු බර්ගර්',
    price: 1000,
    posCategory: 'BURGERS',
    lines: [['BUN-01', 1], ['MUS-01', 45], ['CHE-01', 1], ['HER-01', 2], ['OIL-01', 8], ['LET-01', 12], ['MAY-01', 10], ['BOX-01', 1], ['NAP-01', 2]],
  },
  {
    code: 'BEEF-BURGER',
    name: 'Beef Burger',
    nameSi: 'හරක් මස් බර්ගර්',
    price: 3000,
    posCategory: 'BURGERS',
    lines: [['BUN-01', 1], ['BEF-02', 1], ['CHE-01', 1], ['LET-01', 18], ['TOM-01', 22], ['ONI-01', 15], ['MAY-01', 14], ['KET-01', 10], ['BOX-01', 1], ['NAP-01', 2]],
  },
  {
    code: 'CRISPY-FISH',
    name: 'Crispy Fish Burger',
    nameSi: 'ක්‍රිස්පි මාළු බර්ගර්',
    price: 1600,
    posCategory: 'BURGERS',
    lines: [['BUN-01', 1], ['FSH-CRISP-01', 1], ['CHE-01', 1], ['LET-01', 15], ['MAY-01', 12], ['BOX-01', 1], ['NAP-01', 2]],
  },
  {
    code: 'VEG-BURGER',
    name: 'Vegetable Burger',
    nameSi: 'එළවළු බර්ගර්',
    price: 1000,
    posCategory: 'BURGERS',
    lines: [['BUN-01', 1], ['VEG-PAT-01', 1], ['LET-01', 15], ['TOM-01', 18], ['ONI-01', 12], ['MAY-01', 10], ['BOX-01', 1], ['NAP-01', 2]],
  },
  {
    code: 'VEG-PACHCHI',
    name: 'Vegetable Pachchi Burger',
    nameSi: 'එළවළු පච්චි බර්ගර්',
    price: 1100,
    posCategory: 'BURGERS',
    lines: [['BUN-01', 1], ['VEG-PAC-01', 1], ['LET-01', 12], ['TOM-01', 15], ['ONI-01', 10], ['SPC-SAU-01', 8], ['BOX-01', 1], ['NAP-01', 2]],
  },
  {
    code: 'FRIES-REG',
    name: 'Regular Fries',
    nameSi: 'ෆ්‍රයිස්',
    price: 420,
    posCategory: 'SIDES',
    lines: [['POT-01', 150], ['OIL-01', 25], ['NAP-01', 1]],
  },

  /* ── Hot Dogs ── */
  {
    code: 'HOT-DOG-REG',
    name: 'Regular Hot Dog',
    nameSi: 'සාමාන්‍ය හොට් ඩොග්',
    price: 850,
    posCategory: 'HOT_DOGS',
    lines: [['HOT-BUN-01', 1], ['SAU-REG-01', 1], ['MST-01', 8], ['KET-01', 10], ['NAP-01', 1]],
  },
  {
    code: 'HOT-DOG-CHK-CHE',
    name: 'Cheese & Chicken Hot Dog',
    nameSi: 'චීස් සහ කුකුල් හොට් ඩොග්',
    price: 1100,
    posCategory: 'HOT_DOGS',
    lines: [['HOT-BUN-01', 1], ['SAU-CHK-01', 1], ['CHE-01', 1], ['KET-01', 8], ['NAP-01', 1]],
  },
  {
    code: 'HOT-DOG-SCRAM',
    name: 'Scrambled Hot Dog',
    nameSi: 'ස්කැම්බල් හොට් ඩොග්',
    price: 1000,
    posCategory: 'HOT_DOGS',
    lines: [['HOT-BUN-01', 1], ['SAU-REG-01', 1], ['EGG-01', 2], ['MAY-01', 10], ['NAP-01', 1]],
  },
  {
    code: 'HOT-DOG-VEG',
    name: 'Vegetable Hot Dog',
    nameSi: 'එළවළු හොට් ඩොග්',
    price: 900,
    posCategory: 'HOT_DOGS',
    lines: [['HOT-BUN-01', 1], ['SAU-VEG-01', 1], ['MST-01', 6], ['KET-01', 8], ['LET-01', 10], ['NAP-01', 1]],
  },

  /* ── Submarines ── */
  {
    code: 'SUB-DEV-CHK',
    name: 'Devilled Chicken Submarine',
    nameSi: 'දෙව් ගුඩම් කුකුල් සබ්මැරීන්',
    price: 1700,
    posCategory: 'SUBMARINES',
    lines: [['SUB-BUN-01', 1], ['CHK-01', 140], ['DEV-SAU-01', 40], ['ONI-01', 25], ['CAP-01', 15], ['LET-01', 15], ['TOM-01', 15], ['NAP-01', 2]],
  },
  {
    code: 'SUB-CRISP-CHK',
    name: 'Crispy Chicken Submarine',
    nameSi: 'ක්‍රිස්පි කුකුල් සබ්මැරීන්',
    price: 1600,
    posCategory: 'SUBMARINES',
    lines: [['SUB-BUN-01', 1], ['CHK-STRIP-01', 1], ['CRM-DRS-01', 18], ['LET-01', 12], ['NAP-01', 2]],
  },
  {
    code: 'SUB-PORK',
    name: 'Pork Submarine',
    nameSi: 'ඌරු මස් සබ්මැරීන්',
    price: 2200,
    posCategory: 'SUBMARINES',
    lines: [['SUB-BUN-01', 1], ['PORK-FIL-01', 150], ['CHE-01', 2], ['ONI-01', 25], ['CRM-DRS-01', 10], ['NAP-01', 2]],
  },
];

/** පැරණි demo වට්ටෝරු — menu එකෙන් අයින් කරනවා */
const retiredRecipes = ['CHEESE-BURGER', 'DOUBLE-CHEESE'];

function lineCost(code, qty) {
  const it = items.find((x) => x.code === code);
  if (!it) throw new Error(`Missing item ${code}`);
  return qty * it.cost * (100 / (it.yield || 100));
}

for (const r of recipes) {
  const lines = r.lines.map(([code, qty]) => ({ item: ids[code], qty }));
  const cost = r.lines.reduce((a, [code, qty]) => a + lineCost(code, qty), 0);
  await db.collection('recipes').updateOne(
    { code: r.code },
    {
      $set: {
        code: r.code,
        name: r.name,
        nameSi: r.nameSi,
        kind: 'MENU',
        yieldQty: 1,
        lines,
        modifiers: [],
        posCategory: r.posCategory || 'BURGERS',
        sellPrice: r.price,
        cachedCost: Math.round(cost * 100) / 100,
        costUpdatedAt: new Date(),
        active: true,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
}

await db.collection('recipes').updateMany(
  { code: { $in: retiredRecipes } },
  { $set: { active: false, updatedAt: new Date() } },
);

await db.collection('suppliers').updateOne({ code: 'KEE' }, { $set: {
  code: 'KEE', name: 'Keells Super', phone: '011-2300000', paymentTermsDays: 14, leadTimeDays: 2,
  priceList: [], active: true, createdAt: new Date(), updatedAt: new Date() } }, { upsert: true });
await db.collection('suppliers').updateOne({ code: 'PRI' }, { $set: {
  code: 'PRI', name: 'Prima Bakery', phone: '011-2400000', paymentTermsDays: 7, leadTimeDays: 1,
  priceList: [], active: true, createdAt: new Date(), updatedAt: new Date() } }, { upsert: true });

const burgerCount = recipes.filter((r) => r.posCategory === 'BURGERS').length;
const hotDogCount = recipes.filter((r) => r.posCategory === 'HOT_DOGS').length;
const subCount = recipes.filter((r) => r.posCategory === 'SUBMARINES').length;
console.log(`✓ අයිතම ${items.length}ක්, වට්ටෝරු ${recipes.length}ක් (බර්ගර් ${burgerCount}, හොට් ඩොග් ${hotDogCount}, සබ්මැරීන් ${subCount}) සහ supplier 2ක් update කලා.`);
await mongoose.disconnect();
