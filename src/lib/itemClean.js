/** Item form එකෙන් එන දත්ත පිරිසිදු කිරීම. POST සහ PUT දෙකෙන්ම පාවිච්චි වෙනවා. */
export function clean(b) {
  return {
    code: (b.code || '').trim().toUpperCase(),
    name: (b.name || '').trim(),
    nameSi: (b.nameSi || '').trim(),
    category: b.category || undefined,
    type: b.type || 'RAW',
    unit: (b.unit || 'pcs').trim(),
    purchaseUnits: (b.purchaseUnits || []).filter((u) => u.name && Number(u.factor) > 0)
      .map((u) => ({ name: u.name.trim(), factor: Number(u.factor) })),
    yieldPct: Math.min(100, Math.max(1, Number(b.yieldPct) || 100)),
    reorderLevel: Number(b.reorderLevel) || 0,
    maxLevel: Number(b.maxLevel) || 0,
    defaultLocation: b.defaultLocation || undefined,
    costPerUnit: Number(b.costPerUnit) || 0,
    sellPrice: Number(b.sellPrice) || 0,
    trackExpiry: !!b.trackExpiry,
    perishable: !!b.perishable,
    beverage: {
      isBeverage: !!b.beverage?.isBeverage,
      container: b.beverage?.container || '',
      containerSize: Number(b.beverage?.containerSize) || 0,
      depositValue: Number(b.beverage?.depositValue) || 0,
    },
    notes: b.notes || '',
    active: b.active !== false,
  };
}
