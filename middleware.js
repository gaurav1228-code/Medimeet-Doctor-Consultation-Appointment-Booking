// middleware.js
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  "/doctors(.*)",
  "/Patient-dashboard(.*)",
  "/appointments(.*)",
  "/medical-history(.*)",
  "/profile(.*)",
  "/billing(.*)",
  "/settings(.*)",
]);


export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // Protect the route - user must be authenticated
    const { userId, sessionClaims, redirectToSignIn } = await auth();
    
    // If user is not signed in, redirect to sign in
    if (!userId) {
      return redirectToSignIn();
    }
    
    const userRole = sessionClaims?.metadata?.role;
  
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};