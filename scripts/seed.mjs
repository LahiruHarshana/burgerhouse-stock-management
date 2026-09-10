/**
 * උදාහරණ දත්ත ටිකක් දාන script එකක්.
 * පාවිච්චිය:  npm run seed
 * (මුලින්ම browser එකෙන් setup එක ඉවර කරලා තියෙන්න ඕන)
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
    notes: '', active: true, createdAt: new Date(), updatedAt: new Date(),
  };
  const r = await db.collection('items').findOneAndUpdate(
    { code: it.code }, { $set: doc }, { upsert: true, returnDocument: 'after' });
  const id = r?._id || (await db.collection('items').findOne({ code: it.code }))._id;
  ids[it.code] = id;

  await db.collection('stocklevels').updateOne(
    { item: id, location: loc },
    { $set: { qty: it.qty, value: it.qty * it.cost, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true });
  await db.collection('movements').insertOne({
    item: id, location: loc, qty: it.qty, unitCost: it.cost, balanceAfter: it.qty,
    reason: 'OPENING', note: 'Seed', at: new Date(),
  });
}

const recipes = [
  { code: 'CHEESE-BURGER', name: 'Cheese Burger', nameSi: 'චීස් බර්ගර්', price: 890,
    lines: [['BUN-01', 1], ['BEF-01', 1], ['CHE-01', 1], ['LET-01', 15], ['TOM-01', 20], ['ONI-01', 12], ['MAY-01', 12], ['KET-01', 10], ['BOX-01', 1], ['NAP-01', 2]] },
  { code: 'DOUBLE-CHEESE', name: 'Double Cheese Burger', nameSi: 'ඩබල් චීස් බර්ගර්', price: 1350,
    lines: [['BUN-01', 1], ['BEF-01', 2], ['CHE-01', 2], ['LET-01', 15], ['TOM-01', 20], ['ONI-01', 12], ['MAY-01', 15], ['KET-01', 12], ['BOX-01', 1], ['NAP-01', 2]] },
  { code: 'CHICKEN-BURGER', name: 'Grilled Chicken Burger', nameSi: 'චිකන් බර්ගර්', price: 950,
    lines: [['BUN-01', 1], ['CHK-01', 130], ['LET-01', 20], ['TOM-01', 20], ['MAY-01', 18], ['OIL-01', 10], ['BOX-01', 1], ['NAP-01', 2]] },
  { code: 'FRIES-REG', name: 'Regular Fries', nameSi: 'ෆ්‍රයිස්', price: 420,
    lines: [['POT-01', 150], ['OIL-01', 25], ['NAP-01', 1]] },
];

for (const r of recipes) {
  const lines = r.lines.map(([code, qty]) => ({ item: ids[code], qty }));
  const cost = r.lines.reduce((a, [code, qty]) => {
    const it = items.find((x) => x.code === code);
    return a + qty * it.cost * (100 / (it.yield || 100));
  }, 0);
  await db.collection('recipes').updateOne({ code: r.code }, { $set: {
    code: r.code, name: r.name, nameSi: r.nameSi, kind: 'MENU', yieldQty: 1,
    lines, modifiers: [], sellPrice: r.price, cachedCost: cost, costUpdatedAt: new Date(),
    active: true, createdAt: new Date(), updatedAt: new Date(),
  } }, { upsert: true });
}

await db.collection('suppliers').updateOne({ code: 'KEE' }, { $set: {
  code: 'KEE', name: 'Keells Super', phone: '011-2300000', paymentTermsDays: 14, leadTimeDays: 2,
  priceList: [], active: true, createdAt: new Date(), updatedAt: new Date() } }, { upsert: true });
await db.collection('suppliers').updateOne({ code: 'PRI' }, { $set: {
  code: 'PRI', name: 'Prima Bakery', phone: '011-2400000', paymentTermsDays: 7, leadTimeDays: 1,
  priceList: [], active: true, createdAt: new Date(), updatedAt: new Date() } }, { upsert: true });

console.log(`✓ අයිතම ${items.length}ක්, වට්ටෝරු ${recipes.length}ක් සහ supplier 2ක් දැම්මා.`);
await mongoose.disconnect();
