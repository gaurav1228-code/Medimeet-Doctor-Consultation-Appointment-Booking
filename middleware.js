// middleware.js - UPDATED FOR VERCEL
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabase-client';

const isProtectedRoute = createRouteMatcher([
  "/Patient-dashboard(.*)",
  "/Doctor-dashboard(.*)",
  "/RoleSelector",
  "/user-profile",
  "/admin-dashboard(.*)",
]);

const publicRoutes = [
  "/",
  "/api/",
  "/_next/",
  "/sign-in",
  "/sign-up",
  "/favicon.ico",
];

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const pathname = req.nextUrl.pathname;

  console.log("🔍 Middleware - Path:", pathname, "User ID:", userId);

  // Allow public routes and API routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to sign in for protected routes
  if (!userId && isProtectedRoute(req)) {
    console.log("🚫 No user ID, redirecting to sign in");
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  if (userId) {
    let supabaseRole = null;

    try {
      const supabase = createServerClient();
      
      const { data: userData } = await supabase
        .from("users")
        .select("role, verification_status")
        .eq("clerk_user_id", userId)
        .single();

      if (userData) {
        supabaseRole = userData.role;
        console.log("👤 User role from Supabase:", supabaseRole);
      }

      // ADMIN REDIRECTION LOGIC
      if (supabaseRole === "ADMIN") {
  console.log("🎯 Admin user detected");
  if (!pathname.startsWith("/admin-dashboard")) {
    const adminUrl = new URL("/admin-dashboard", req.url);
    // Use the same domain instead of hardcoding
    adminUrl.hostname = req.nextUrl.hostname;
    return NextResponse.redirect(adminUrl);
  }
} else if (pathname.startsWith("/admin-dashboard")) {
        console.log("🚫 Non-admin trying to access admin dashboard");
        return NextResponse.redirect(new URL("/", req.url));
      }

      // If user has no role and is not on RoleSelector, redirect
      if ((!supabaseRole || supabaseRole === "UNASSIGNED") && pathname !== "/RoleSelector") {
        console.log("🔄 No role assigned, redirecting to RoleSelector");
        return NextResponse.redirect(new URL("/RoleSelector", req.url));
      }

      // If user has a role and is on RoleSelector, redirect to appropriate dashboard
      if ((supabaseRole === "PATIENT" || supabaseRole === "DOCTOR") && pathname === "/RoleSelector") {
        console.log("🔄 Role assigned, redirecting to dashboard:", supabaseRole);
        const dashboardPath = supabaseRole === "DOCTOR" ? "/Doctor-dashboard" : "/Patient-dashboard";
        return NextResponse.redirect(new URL(dashboardPath, req.url));
      }

      // Doctor verification check
      if (supabaseRole === "DOCTOR" && userData.verification_status !== "VERIFIED") {
        if (!pathname.startsWith("/Doctor-dashboard/verification") && pathname !== "/user-profile") {
          console.log("🔄 Doctor not verified, redirecting to verification");
          return NextResponse.redirect(new URL("/Doctor-dashboard/verification", req.url));
        }
      }

      // Role-based access control
      if (pathname.startsWith("/Patient-dashboard") && supabaseRole !== "PATIENT") {
        console.log("🚫 Invalid access to patient dashboard");
        return NextResponse.redirect(new URL("/", req.url));
      }

      if (pathname.startsWith("/Doctor-dashboard") && supabaseRole !== "DOCTOR") {
        console.log("🚫 Invalid access to doctor dashboard");
        return NextResponse.redirect(new URL("/", req.url));
      }

    } catch (error) {
      console.error("❌ Error in middleware:", error);
      // Allow access on error to prevent blocking users
      return NextResponse.next();
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/api/(.*)"
  ],
};