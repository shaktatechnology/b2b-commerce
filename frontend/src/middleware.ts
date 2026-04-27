import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a simplified middleware for the starter kit.
// In a real app, you would verify a session cookie or JWT.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Simulate authentication check
  // Replace this with actual cookie/token verification
  const isAuth = request.cookies.get('auth-token');

  // 1. Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    if (!isAuth) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  // 2. Redirect Logged-in Users from Auth Pages
  if (isAuth && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // 3. Redirect /admin root to /admin/dashboard
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
