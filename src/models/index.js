import { mongoose, model } from '@/lib/db';
const { Schema, Types } = mongoose;

const money = { type: Number, default: 0, min: 0 };
const oid = (ref) => ({ type: Types.ObjectId, ref });

/* ─────────── Core ─────────── */

const SettingsSchema = new Schema({
  singleton: { type: String, default: 'app', unique: true, immutable: true },
  shopName: { type: String, default: 'Burger House' },
  currency: { type: String, default: 'LKR' },
  enabledModules: { type: [String], default: ['items', 'users'] },
  costingMethod: { type: String, enum: ['AVERAGE', 'FIFO'], default: 'AVERAGE' },
  lowStockDays: { type: Number, default: 7 },   // expiry alert window
  apiKey: { type: String, default: '' },        // POS එකෙන් data එවන්න
  setupDone: { type: Boolean, default: false },
}, { timestamps: true });

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['OWNER', 'MANAGER', 'STOREKEEPER', 'CHEF', 'VIEWER'], default: 'VIEWER' },
  locale: { type: String, enum: ['en', 'si'], default: 'en' },
  locations: [oid('Location')],  // හිස්නම් = හැම තැනම
  active: { type: Boolean, default: true },
}, { timestamps: true });

const AuditSchema = new Schema({
  user: oid('User'), userName: String,
  action: String, entity: String, entityId: String,
  detail: Schema.Types.Mixed,
  at: { type: Date, default: Date.now },
});
AuditSchema.index({ at: -1 });
AuditSchema.index({ entity: 1, entityId: 1 });

/* ─────────── Module 1: Items ─────────── */

const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  kind: { type: String, enum: ['FOOD', 'BEVERAGE', 'PACKAGING', 'OTHER'], default: 'FOOD' },
  sort: { type: Number, default: 0 },
});

const LocationSchema = new Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['MAIN_STORE', 'FREEZER', 'CHILLER', 'DRY_STORE', 'KITCHEN', 'BAR'], default: 'MAIN_STORE' },
  branch: { type: String, default: 'Main' },
  active: { type: Boolean, default: true },
});
LocationSchema.index({ name: 1, branch: 1 }, { unique: true });

const ItemSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  nameSi: { type: String, default: '', trim: true },
  category: oid('Category'),
  type: { type: String, enum: ['RAW', 'SEMI', 'FINISHED', 'NONFOOD'], default: 'RAW' },

  // Stock තියාගන්නේ මේ unit එකෙන් (base unit). උදා: g, ml, pcs
  unit: { type: String, required: true, default: 'pcs' },
  // ගන්නකොට පාවිච්චි කරන unit ටික. උදා: 1 case = 24 bottle = 8400 ml
  purchaseUnits: [{
    name: { type: String, required: true },   // "case"
    factor: { type: Number, required: true, min: 0.000001 }, // base unit කීයද
  }],

  // Yield: kg 1ක් කුකුල් මස් -> පාවිච්චි කරන්න පුළුවන් 85%
  yieldPct: { type: Number, default: 100, min: 1, max: 100 },

  reorderLevel: { type: Number, default: 0 },
  maxLevel: { type: Number, default: 0 },
  defaultLocation: oid('Location'),

  costPerUnit: money,        // weighted average cost (base unit එකකට)
  lastPurchasePrice: money,
  sellPrice: money,          // finished item එකක්නම්

  trackExpiry: { type: Boolean, default: false },
  perishable: { type: Boolean, default: false },

  // Module 7 (Beverages)
  beverage: {
    isBeverage: { type: Boolean, default: false },
    container: { type: String, enum: ['', 'BOTTLE', 'CAN', 'KEG', 'DRAFT'], default: '' },
    containerSize: { type: Number, default: 0 },     // ml
    depositValue: money,                              // හිස් බෝතලයක ඇපය
  },

  notes: { type: String, default: '' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

// වේගවත් search එකට
ItemSchema.index({ name: 'text', nameSi: 'text', code: 'text' });
ItemSchema.index({ active: 1, category: 1 });

/* ─────────── Module 4: Stock ─────────── */

// වේගය සඳහා: තොග ප්‍රමාණය movement වලින් ගණන් නොකර මෙතන තියාගන්නවා
const StockLevelSchema = new Schema({
  item: { ...oid('Item'), required: true },
  location: { ...oid('Location'), required: true },
  qty: { type: Number, default: 0 },
  value: { type: Number, default: 0 },   // qty * avg cost
}, { timestamps: true });
StockLevelSchema.index({ item: 1, location: 1 }, { unique: true });
StockLevelSchema.index({ location: 1 });

const BatchSchema = new Schema({
  item: { ...oid('Item'), required: true },
  location: { ...oid('Location'), required: true },
  batchNo: { type: String, default: '' },
  expiry: { type: Date, default: null },
  qty: { type: Number, default: 0 },
  cost: money,
  receivedAt: { type: Date, default: Date.now },
});
BatchSchema.index({ item: 1, location: 1, expiry: 1 });  // FEFO
BatchSchema.index({ expiry: 1, qty: 1 });                // expiry alert

const MovementSchema = new Schema({
  item: { ...oid('Item'), required: true },
  location: { ...oid('Location'), required: true },
  qty: { type: Number, required: true },     // + ඇතුළට, − පිටතට
  unitCost: money,
  balanceAfter: { type: Number, default: 0 },
  reason: {
    type: String, required: true,
    enum: ['GRN', 'PURCHASE_RETURN', 'SALE', 'WASTAGE', 'TRANSFER_IN', 'TRANSFER_OUT',
           'ADJUSTMENT', 'STOCKTAKE', 'OPENING', 'PRODUCTION_IN', 'PRODUCTION_OUT'],
  },
  refType: String, refId: String, note: String,
  batch: oid('Batch'),
  user: oid('User'), userName: String,
  at: { type: Date, default: Date.now },
});
MovementSchema.index({ item: 1, at: -1 });
MovementSchema.index({ at: -1 });
MovementSchema.index({ reason: 1, at: -1 });

/* ─────────── Module 2: Recipes ─────────── */

const RecipeSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  nameSi: { type: String, default: '' },
  kind: { type: String, enum: ['MENU', 'SUB'], default: 'MENU' },  // SUB = sauce වගේ
  yieldQty: { type: Number, default: 1, min: 0.0001 },             // කීයක් හැදෙනවද
  producesItem: oid('Item'),                                      // SUB recipe එකක් නම්
  lines: [{
    item: oid('Item'),
    subRecipe: oid('Recipe'),
    qty: { type: Number, required: true, min: 0 },   // base unit වලින්
    note: String,
  }],
  modifiers: [{                                      // extra cheese වගේ
    name: String,
    item: oid('Item'),
    qty: { type: Number, default: 0 },
    extraPrice: money,
  }],
  posCategory: { type: String, enum: ['BURGERS', 'HOT_DOGS', 'SUBMARINES', 'SIDES', 'DRINKS', 'OTHER'] },
  sellPrice: money,
  cachedCost: money,          // ගණනය කරලා තියාගන්නවා -> report ඉක්මන්
  costUpdatedAt: Date,
  active: { type: Boolean, default: true },
}, { timestamps: true });

/* ─────────── Module 3: Purchasing ─────────── */

const SupplierSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  phone: String, email: String, address: String,
  paymentTermsDays: { type: Number, default: 0 },
  leadTimeDays: { type: Number, default: 1 },
  priceList: [{ item: oid('Item'), price: money, unit: String, updatedAt: Date }],
  active: { type: Boolean, default: true },
}, { timestamps: true });

const POSchema = new Schema({
  poNo: { type: String, required: true, unique: true },
  supplier: oid('Supplier'), supplierName: String,
  location: oid('Location'),
  status: { type: String, enum: ['DRAFT', 'SENT', 'PARTIAL', 'RECEIVED', 'CANCELLED'], default: 'DRAFT' },
  expectedDate: Date,
  lines: [{
    item: oid('Item'), itemName: String, itemCode: String,
    unit: String, factor: { type: Number, default: 1 },
    qty: { type: Number, default: 0 },        // ordered (purchase unit)
    receivedQty: { type: Number, default: 0 },
    price: money,                              // purchase unit එකකට
  }],
  extraCost: money,     // ප්‍රවාහන ගාස්තු -> landed cost
  total: money,
  note: String,
  createdBy: oid('User'),
}, { timestamps: true });
POSchema.index({ status: 1, createdAt: -1 });

const GRNSchema = new Schema({
  grnNo: { type: String, required: true, unique: true },
  po: oid('PurchaseOrder'), poNo: String,
  supplier: oid('Supplier'), supplierName: String,
  location: oid('Location'),
  invoiceNo: String,
  receivedAt: { type: Date, default: Date.now },
  lines: [{
    item: oid('Item'), itemName: String,
    unit: String, factor: { type: Number, default: 1 },
    qty: Number,              // purchase unit
    baseQty: Number,          // base unit
    price: money,             // purchase unit එකකට
    batchNo: String, expiry: Date,
  }],
  extraCost: money,
  total: money,
  createdBy: oid('User'), createdByName: String,
}, { timestamps: true });
GRNSchema.index({ receivedAt: -1 });

/* ─────────── Module 5: Wastage ─────────── */

const WastageSchema = new Schema({
  item: oid('Item'), itemName: String,
  location: oid('Location'),
  qty: { type: Number, required: true, min: 0 },
  cost: money,
  reason: {
    type: String, required: true,
    enum: ['EXPIRED', 'SPOILED', 'COOKING_ERROR', 'CUSTOMER_RETURN', 'SPILLAGE', 'STAFF_MEAL', 'COMPLIMENTARY', 'OTHER'],
  },
  note: String,
  user: oid('User'), userName: String,
  at: { type: Date, default: Date.now },
}, { timestamps: true });
WastageSchema.index({ at: -1 });
WastageSchema.index({ reason: 1, at: -1 });

/* ─────────── Module 6: Stocktake ─────────── */

const StocktakeSchema = new Schema({
  ref: { type: String, required: true, unique: true },
  location: oid('Location'), locationName: String,
  status: { type: String, enum: ['OPEN', 'SUBMITTED', 'APPROVED', 'CANCELLED'], default: 'OPEN' },
  lines: [{
    item: oid('Item'), itemName: String, itemCode: String, unit: String,
    systemQty: Number,
    countedQty: { type: Number, default: null },
    cost: money,
  }],
  varianceValue: { type: Number, default: 0 },
  countedBy: oid('User'), countedByName: String,
  approvedBy: oid('User'), approvedByName: String,
  approvedAt: Date,
}, { timestamps: true });

/* ─────────── Module 9: Sales ─────────── */

const SaleSchema = new Schema({
  ref: { type: String, required: true, unique: true },
  source: { type: String, default: 'MANUAL' },   // MANUAL | API | TERMINAL
  location: oid('Location'),
  lines: [{
    recipe: oid('Recipe'), item: oid('Item'),
    name: String, qty: { type: Number, default: 1 },
    price: money, cost: money,
    modifiers: [String],
  }],
  total: money, totalCost: money,
  paymentMethod: { type: String, enum: ['CASH', 'CARD'] },
  serviceType: { type: String, enum: ['DINE_IN', 'TAKEAWAY'] },
  at: { type: Date, default: Date.now },
  user: oid('User'), userName: String,
}, { timestamps: true });
SaleSchema.index({ at: -1 });

/* ─────────── Export ─────────── */

export const Settings      = model('Settings', SettingsSchema);
export const User          = model('User', UserSchema);
export const Audit         = model('Audit', AuditSchema);
export const Category      = model('Category', CategorySchema);
export const Location      = model('Location', LocationSchema);
export const Item          = model('Item', ItemSchema);
export const StockLevel    = model('StockLevel', StockLevelSchema);
export const Batch         = model('Batch', BatchSchema);
export const Movement      = model('Movement', MovementSchema);
export const Recipe        = model('Recipe', RecipeSchema);
export const Supplier      = model('Supplier', SupplierSchema);
export const PurchaseOrder = model('PurchaseOrder', POSchema);
export const GRN           = model('GRN', GRNSchema);
export const Wastage       = model('Wastage', WastageSchema);
export const Stocktake     = model('Stocktake', StocktakeSchema);
export const Sale          = model('Sale', SaleSchema);
