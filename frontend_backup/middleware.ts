import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Korumalı sayfalar
const protectedRoutes = [
  '/dashboard',
  '/passengers',
  '/emails',
  '/inbox',
  '/groups',
  '/settings',
  '/activity',
  '/profile',
];

// Auth sayfaları (giriş yapmışsa yönlendirilecek)
const authRoutes = ['/auth/login', '/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Token'ı cookie'den al (httpOnly olmayan cookie veya header)
  const token = request.cookies.get('token')?.value;

  // Korumalı sayfalar için token kontrolü
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (isProtectedRoute && !token) {
    // Token yoksa login sayfasına yönlendir
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth sayfaları için - zaten giriş yapmışsa dashboard'a yönlendir
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|$).*)',
  ],
};
