// middleware.js
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  "/Patient-dashboard(.*)",
  "/Doctor-dashboard(.*)", 
  "/appointments(.*)",
  "/medical-history(.*)",
  "/profile(.*)",
  "/billing(.*)",
  "/settings(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId, sessionClaims, redirectToSignIn } = await auth();
    
    // Redirect to sign in if not authenticated
    if (!userId) {
      return redirectToSignIn();
    }
    
    const userRole = sessionClaims?.metadata?.role;
    const pathname = req.nextUrl.pathname;
    
    console.log("🛡️ Middleware: User role:", userRole, "Path:", pathname);
    
    // Allow access if role is UNASSIGNED (user is still selecting role)
    if (userRole === 'UNASSIGNED') {
      console.log("✅ Middleware: Allowing UNASSIGNED user to access:", pathname);
      return NextResponse.next();
    }
    
    // Role-based route protection
    if (pathname.startsWith('/Patient-dashboard') && userRole !== 'PATIENT') {
      console.log("🚫 Middleware: Redirecting non-PATIENT from Patient dashboard");
      if (userRole === 'DOCTOR') {
        return NextResponse.redirect(new URL('/Doctor-dashboard', req.url));
      }
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    if (pathname.startsWith('/Doctor-dashboard') && userRole !== 'DOCTOR') {
      console.log("🚫 Middleware: Redirecting non-DOCTOR from Doctor dashboard");
      if (userRole === 'PATIENT') {
        return NextResponse.redirect(new URL('/Patient-dashboard', req.url));
      }
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    console.log("✅ Middleware: Allowing access to:", pathname);
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};