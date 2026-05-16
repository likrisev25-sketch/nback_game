import { auth } from '@/server/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware для защиты маршрутов
 * /profile — требует авторизации
 * /leaderboard — публичный
 * / — обрабатывается в page.tsx (LandingAuth для гостей)
 */
export default function middleware(request: NextRequest) {
  const { nextUrl } = request;
  
  // Только /profile требует авторизации
  const isProtectedRoute = nextUrl.pathname.startsWith('/profile');

  // Проверяем сессию по куке Better Auth
  const sessionCookie = request.cookies.get('better-auth.session_token');
  const isLoggedIn = !!sessionCookie;
  
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
