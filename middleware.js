// middleware.js
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  "/Patient-dashboard(.*)",
  "/Doctor-dashboard(.*)", 
  "/RoleSelector",
]);

const publicRoutes = ["/", "/api/", "/_next/"];

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const pathname = req.nextUrl.pathname;
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Redirect unauthenticated users to sign in for protected routes
  if (!userId && isProtectedRoute(req)) {
    return auth().redirectToSignIn();
  }
  
  if (userId) {
    const userRole = sessionClaims?.metadata?.role;
    
    // If user has no role and is not on RoleSelector, redirect
    if ((!userRole || userRole === 'UNASSIGNED') && pathname !== '/RoleSelector') {
      return NextResponse.redirect(new URL('/RoleSelector', req.url));
    }
    
    // If user has a role and is on RoleSelector, redirect to appropriate dashboard
    if ((userRole === 'PATIENT' || userRole === 'DOCTOR') && pathname === '/RoleSelector') {
      return NextResponse.redirect(new URL(`/${userRole.toLowerCase()}-dashboard`, req.url));
    }
    
    // Role-based access control
    if (pathname.startsWith('/Patient-dashboard') && userRole !== 'PATIENT') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    if (pathname.startsWith('/Doctor-dashboard') && userRole !== 'DOCTOR') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};