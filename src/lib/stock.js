import { Item, StockLevel, Movement, Batch } from '@/models';

export class StockError extends Error {
  constructor(i18nKey, vars = {}) {
    super(i18nKey);
    this.i18nKey = i18nKey;
    this.vars = vars;
  }
}

/**
 * තොග චලනයක් (movement) පටිගත කරන එකම ස්ථානය.
 */
export async function moveStock({
  item, location, qty, cost = null, reason, refType, refId, note,
  user, batchNo, expiry, allowNegative = true,
}) {
  if (!qty || !isFinite(qty)) throw new StockError('errors.stockInvalidQty');

  const itemDoc = await Item.findById(item).select('costPerUnit trackExpiry name').lean();
  if (!itemDoc) throw new StockError('errors.itemNotFound');

  const level = await StockLevel.findOneAndUpdate(
    { item, location },
    { $setOnInsert: { qty: 0, value: 0 } },
    { upsert: true, new: true },
  );

  let unitCost = cost ?? itemDoc.costPerUnit ?? 0;
  let newQty = level.qty + qty;

  if (!allowNegative && newQty < 0) {
    throw new StockError('errors.stockInsufficient', {
      name: itemDoc.name,
      onHand: level.qty,
      qty: Math.abs(qty),
    });
  }

  let avgCost = itemDoc.costPerUnit || 0;
  if (qty > 0 && cost != null) {
    const oldValue = level.qty > 0 ? level.qty * avgCost : 0;
    avgCost = newQty > 0 ? (oldValue + qty * cost) / newQty : cost;
    await Item.updateOne({ _id: item }, { $set: { costPerUnit: avgCost, lastPurchasePrice: cost } });
    unitCost = cost;
  }

  level.qty = newQty;
  level.value = newQty * avgCost;
  await level.save();

  let batchId = null;
  if (qty > 0 && (expiry || batchNo)) {
    const b = await Batch.create({ item, location, batchNo: batchNo || '', expiry: expiry || null, qty, cost: unitCost });
    batchId = b._id;
  } else if (qty < 0 && itemDoc.trackExpiry) {
    await consumeFEFO(item, location, -qty);
  }

  const mv = await Movement.create({
    item, location, qty, unitCost, balanceAfter: newQty, reason,
    refType, refId: refId ? String(refId) : undefined, note,
    batch: batchId, user: user?.id, userName: user?.name,
  });

  return { movement: mv, balance: newQty, unitCost };
}

async function consumeFEFO(item, location, need) {
  const batches = await Batch.find({ item, location, qty: { $gt: 0 } })
    .sort({ expiry: 1, receivedAt: 1 }).limit(50);
  for (const b of batches) {
    if (need <= 0) break;
    const take = Math.min(b.qty, need);
    b.qty -= take; need -= take;
    await b.save();
  }
}

export async function moveMany(list) {
  const out = [];
  for (const m of list) out.push(await moveStock(m));
  return out;
}

export async function levelsFor(itemIds, location = null) {
  const q = { item: { $in: itemIds } };
  if (location) q.location = location;
  const rows = await StockLevel.find(q).select('item location qty').lean();
  const map = {};
  for (const r of rows) map[r.item] = (map[r.item] || 0) + r.qty;
  return map;
}
