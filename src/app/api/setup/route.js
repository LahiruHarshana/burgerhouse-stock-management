import { db } from '@/lib/db';
import { Settings, User, Location, Category } from '@/models';
import { hash, setSession } from '@/lib/auth';
import { ok, badKey, body, bustSettingsCache } from '@/lib/api';
import { resolveEnabled } from '@/lib/modules';
import { DEFAULT_LOCALE } from '@/lib/i18n';
import { getAuthLocale } from '@/lib/locale.server';
import { randomBytes } from 'crypto';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
/** පළමු වතාවේ system එක සකස් කිරීම. දැනටමත් user කෙනෙක් ඉන්නවනම් වැඩ කරන්නේ නෑ. */
export async function POST(req) {
  await db();
  if (await User.countDocuments()) return badKey(DEFAULT_LOCALE, 'errors.setupDone', 409);

  const b = await body(req);
  if (!b.shopName?.trim()) return badKey(DEFAULT_LOCALE, 'errors.shopNameRequired');
  if (!b.username?.trim() || (b.password || '').length < 6) return badKey(DEFAULT_LOCALE, 'errors.credentialsRequired');

  const user = await User.create({
    name: b.fullName?.trim() || 'Owner',
    username: b.username.trim().toLowerCase(),
    passwordHash: await hash(b.password),
    role: 'OWNER',
    locale: getAuthLocale(),
  });

  await Settings.findOneAndUpdate(
    { singleton: 'app' },
    {
      $set: {
        shopName: b.shopName.trim(),
        currency: b.currency || 'LKR',
        enabledModules: resolveEnabled(b.modules || []),
        apiKey: randomBytes(24).toString('hex'),
        setupDone: true,
      },
    },
    { upsert: true },
  );
  bustSettingsCache();

  // පටන් ගන්න ඕන අවම දේවල්
  await Location.create({ name: 'Main Store', type: 'MAIN_STORE', branch: 'Main' });
  await Category.insertMany([
    { name: 'Meat', kind: 'FOOD', sort: 1 }, { name: 'Buns & Bakery', kind: 'FOOD', sort: 2 },
    { name: 'Vegetables', kind: 'FOOD', sort: 3 }, { name: 'Sauces & Spices', kind: 'FOOD', sort: 4 },
    { name: 'Dairy', kind: 'FOOD', sort: 5 }, { name: 'Beverages', kind: 'BEVERAGE', sort: 6 },
    { name: 'Packaging', kind: 'PACKAGING', sort: 7 }, { name: 'Cleaning', kind: 'OTHER', sort: 8 },
  ]);

  await setSession({ id: String(user._id), name: user.name, username: user.username, role: user.role });
  return ok({ ok: true });
}

export async function GET() {
  await db();
  return ok({ needsSetup: (await User.countDocuments()) === 0 });
}
