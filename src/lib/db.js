import mongoose from 'mongoose';

const URI = process.env.MONGODB_URI;

// Next.js dev mode එකේ හැම hot-reload එකකදිම අලුත් connection එකක් හැදෙනවා.
// ඒක නවත්තන්න global cache එකක් තියාගන්නවා -> speed + connection limit ආරක්ෂාව.
let cached = global.__mongoose;
if (!cached) cached = global.__mongoose = { conn: null, promise: null };

export async function db() {
  if (cached.conn) return cached.conn;
  if (!URI) throw new Error('MONGODB_URI .env file එකේ නෑ');

  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose.connect(URI, {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 8000,
      w: 1,
    }).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Model එකක් දෙපාරක් register වීම (hot reload) නවත්තන helper එක
export function model(name, schema) {
  return mongoose.models[name] || mongoose.model(name, schema);
}

export { mongoose };
