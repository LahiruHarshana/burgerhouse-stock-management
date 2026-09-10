import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';


// මේවා හැම request එකකදිම අලුතෙන් run වෙන්න ඕන (cache වෙන්න බෑ)
export const dynamic = 'force-dynamic';
export async function POST(req) {
  clearSession();
  return NextResponse.redirect(new URL('/login', req.url), { status: 303 });
}
