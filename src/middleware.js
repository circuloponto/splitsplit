import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/', 
  '/sign-in',
  '/sign-up',
  '/sso-callback',
  '/api/webhooks',
];

export function middleware(request) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;
  
  // Check if the pathname is a public route or starts with a public route
  const isPublicRoute = publicRoutes.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // If the route is public, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Check if the user has a session token
  const hasSessionToken = request.cookies.has('__session') || 
                          request.cookies.has('__clerk_db_jwt');
  
  // If the user is not authenticated and the route is not public,
  // redirect to the sign-in page
  if (!hasSessionToken) {
    const signInUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }
  
  // Otherwise, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};