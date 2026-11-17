/**
 * Delete all users and create a single new Owner account.
 * Usage: npm run reset-users
 * Optional env (in shell or .env): ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_NAME
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

const username = (process.env.ADMIN_USERNAME || env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || env.ADMIN_PASSWORD || 'burger123';
const name = (process.env.ADMIN_NAME || env.ADMIN_NAME || 'Admin').trim();

if (password.length < 6) {
  console.error('Password must be at least 6 characters.');
  process.exit(1);
}

if (!env.MONGODB_URI) {
  console.error('MONGODB_URI missing in .env');
  process.exit(1);
}

const srvMatch = env.MONGODB_URI.match(/@([a-zA-Z0-9.-]+\.mongodb\.net)/);
const clusterHost = srvMatch?.[1];

try {
  await mongoose.connect(env.MONGODB_URI);
} catch (err) {
  if (err.code === 'ENOTFOUND' || /querySrv ENOTFOUND/.test(String(err.message))) {
    console.error('Cannot resolve MongoDB host — the cluster in MONGODB_URI does not exist or the URI is wrong.');
    if (clusterHost) console.error(`  Host: ${clusterHost}`);
    console.error('\nFix: MongoDB Atlas → your cluster → Connect → Drivers → copy the connection string into .env');
    console.error('     Or use local: MONGODB_URI="mongodb://127.0.0.1:27017/burger_stock"');
  } else {
    console.error(err.message || err);
  }
  process.exit(1);
}
const db = mongoose.connection.db;

const del = await db.collection('users').deleteMany({});
console.log(`Removed ${del.deletedCount} user(s).`);

const passwordHash = await bcrypt.hash(password, 10);
const now = new Date();
const { insertedId } = await db.collection('users').insertOne({
  name,
  username,
  passwordHash,
  role: 'OWNER',
  locale: 'en',
  locations: [],
  active: true,
  createdAt: now,
  updatedAt: now,
});

console.log('New Owner created:');
console.log(`  Username: ${username}`);
console.log(`  Password: ${password}`);
console.log(`  id:       ${insertedId}`);

await mongoose.disconnect();