import { Settings } from '@/models';
import { guard, ok, badKey, body, log, bustSettingsCache } from '@/lib/api';
import { resolveEnabled } from '@/lib/modules';
import { CAN as PERM } from '@/lib/auth';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function GET() {
  const g = await guard();
  if (g.error) return g.error;
  return ok({ enabled: resolveEnabled(g.settings.enabledModules), settings: {
    shopName: g.settings.shopName, currency: g.settings.currency,
    costingMethod: g.settings.costingMethod, lowStockDays: g.settings.lowStockDays,
  } });
}

export async function PUT(req) {
  const g = await guard({ can: PERM.admin });
  if (g.error) return g.error;

  const b = await body(req);
  const patch = {};
  if (Array.isArray(b.modules)) patch.enabledModules = resolveEnabled(b.modules);
  if (typeof b.shopName === 'string' && b.shopName.trim()) patch.shopName = b.shopName.trim();
  if (b.currency) patch.currency = b.currency;
  if (b.costingMethod) patch.costingMethod = b.costingMethod;
  if (b.lowStockDays != null) patch.lowStockDays = Math.max(1, Number(b.lowStockDays) || 7);
  if (!Object.keys(patch).length) return badKey(g.locale, 'errors.nothingToSave');

  await Settings.updateOne({ singleton: 'app' }, { $set: patch }, { upsert: true });
  bustSettingsCache();
  await log(g.user, 'UPDATE', 'Settings', 'app', patch);
  return ok({ enabled: patch.enabledModules ?? resolveEnabled(g.settings.enabledModules) });
}
