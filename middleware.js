// middleware.js - UPDATED FOR NETLIFY
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/Patient-dashboard(.*)",
  "/Doctor-dashboard(.*)", 
  "/RoleSelector",
  "/user-profile",
  "/admin-dashboard(.*)",
]);

const publicRoutes = [
  "/",
  "/api/(.*)",
  "/_next/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/favicon.ico",
];

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const pathname = req.nextUrl.pathname;

  console.log("🔍 Netlify Middleware - Path:", pathname, "User ID:", userId);

  // Allow public routes
  if (publicRoutes.some(route => new RegExp(route).test(pathname))) {
    return NextResponse.next();
  }

  // Allow API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to sign in for protected routes
  if (!userId && isProtectedRoute(req)) {
    console.log("🚫 No user ID, redirecting to sign in");
    const signInUrl = new URL('/sign-in', req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};