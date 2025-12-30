import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware for route protection
 * 
 * This middleware runs on every request and:
 * 1. Checks if the user has a valid token
 * 2. Redirects to /login if accessing protected routes without token
 * 3. Redirects authenticated users away from public auth pages
 */

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value;

  // List of protected routes (require authentication)
  const protectedRoutes = ['/', '/settings', '/profile', '/dashboard', '/admin'];

  // List of public routes (accessible without authentication)
  const publicRoutes = ['/login', '/register', '/forgot-password'];

  const pathname = request.nextUrl.pathname;

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from login/register pages
  if ((pathname === '/login' || pathname === '/register') && accessToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

/**
 * Configure which routes should be processed by middleware
 * 
 * Using matcher to exclude:
 * - API routes
 * - Static files
 * - Images
 * - Manifest and other special files
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (Service worker)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
};
