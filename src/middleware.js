import { NextResponse } from 'next/server';

/**
 * Cookie එකක් නැති අයව login එකට යවනවා.
 * Token එක වලංගුද කියලා හරියටම බලන්නේ page එකේදි (DB එක්ක).
 * මේකෙන් වෙන්නේ අනවශ්‍ය page render එකක් නවත්තලා speed වැඩි කරන එක.
 */
export function middleware(req) {
  const { pathname } = req.nextUrl;
  const open = pathname.startsWith('/login') || pathname.startsWith('/setup') || pathname.startsWith('/api/');
  if (open) return NextResponse.next();
  if (!req.cookies.get('bh_session')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
