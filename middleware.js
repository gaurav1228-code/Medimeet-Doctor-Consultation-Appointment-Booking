// middleware.js - FIXED FOR NETLIFY
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/Patient-dashboard(.*)",
  "/Doctor-dashboard(.*)",
  "/RoleSelector",
  "/user-profile",
  "/admin-dashboard(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl;
  const pathname = url.pathname;

  // Public routes that don't require authentication
  if (
    pathname === "/" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.includes(".") // Static files
  ) {
    return NextResponse.next();
  }

  // If user is not signed in and trying to access protected route, redirect to sign-in
  if (!userId && isProtectedRoute(req)) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // If user is signed in, allow access to all routes
  // The role-based redirection will be handled in the components
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};