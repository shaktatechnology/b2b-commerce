import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a simplified middleware for the starter kit.
// In a real app, you would verify a session cookie or JWT.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuth = request.cookies.get('auth-token');
  const roleCookie = request.cookies.get('role');
  const role = roleCookie?.value || 'user'; // default fallback

  // 1. Redirect Logged-in Users away from Auth Pages
  if (isAuth && (pathname === '/login' || pathname === '/register' || pathname === '/wholeseller_login')) {
    if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    if (role === 'wholeseller' || role === 'wholesaler') return NextResponse.redirect(new URL('/wholeseller', request.url));
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    if (!isAuth) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    // Block non-admins
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Redirect /admin root to /admin/dashboard
    if (pathname === '/admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  // 3. Protect Wholeseller Routes
  if (pathname.startsWith('/wholeseller') && !pathname.includes('login') && !pathname.includes('register')) {
    if (!isAuth) {
      const url = new URL('/wholeseller_login', request.url);
      return NextResponse.redirect(url);
    }
    if (role !== 'wholeseller' && role !== 'wholesaler' && role !== 'admin') {
      // If a regular user tries to access wholeseller page, boot them home
      return NextResponse.redirect(new URL('/', request.url));
    }
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
