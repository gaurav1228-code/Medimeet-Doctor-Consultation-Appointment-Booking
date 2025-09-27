// middleware.js
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

   if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to sign in for protected routes
  if (!userId && isProtectedRoute(req)) {
    console.log("🚫 No user ID, redirecting to sign in");
    return auth().redirectToSignIn();
  }

  if (userId) {
    let supabaseRole = null;

    try {
      const { data: userData } = await supabase
        .from("users")
        .select(
          "role, verification_status, aadhaar_verified, pan_verified, medical_license_verified, document_urls"
        )
        .eq("clerk_user_id", userId)
        .single();

      if (userData) {
        supabaseRole = userData.role;
        console.log("👤 User role from Supabase:", supabaseRole);
      }

      // ADMIN REDIRECTION LOGIC - CRITICAL FIX
      if (supabaseRole === "ADMIN") {
        console.log("🎯 Admin user detected");
        // If admin is trying to access any page except admin-dashboard, redirect to admin-dashboard
        if (!pathname.startsWith("/admin-dashboard")) {
          console.log("🔄 Redirecting admin to /admin-dashboard");
          return NextResponse.redirect(new URL("/admin-dashboard", req.url));
        }
      } else if (pathname.startsWith("/admin-dashboard")) {
        console.log(
          "🚫 Non-admin trying to access admin dashboard, redirecting to home"
        );
        return NextResponse.redirect(new URL("/", req.url));
      }

      // If user has no role and is not on RoleSelector, redirect
      if (
        (!supabaseRole || supabaseRole === "UNASSIGNED") &&
        pathname !== "/RoleSelector"
      ) {
        console.log("🔄 No role assigned, redirecting to RoleSelector");
        return NextResponse.redirect(new URL("/RoleSelector", req.url));
      }

      // If user has a role and is on RoleSelector, redirect to appropriate dashboard
      if (
        (supabaseRole === "PATIENT" || supabaseRole === "DOCTOR") &&
        pathname === "/RoleSelector"
      ) {
        console.log(
          "🔄 Role assigned, redirecting to dashboard:",
          supabaseRole
        );
        const dashboardPath =
          supabaseRole === "DOCTOR"
            ? "/Doctor-dashboard/verification"
            : "/Patient-dashboard";
        return NextResponse.redirect(new URL(dashboardPath, req.url));
      }

      // Role-based access control
      if (
        pathname.startsWith("/Patient-dashboard") &&
        supabaseRole !== "PATIENT"
      ) {
        console.log("🚫 Invalid access to patient dashboard");
        return NextResponse.redirect(new URL("/", req.url));
      }

      if (
        pathname.startsWith("/Doctor-dashboard") &&
        supabaseRole !== "DOCTOR"
      ) {
        console.log("🚫 Invalid access to doctor dashboard");
        return NextResponse.redirect(new URL("/", req.url));
      }
    } catch (error) {
      console.error("❌ Error in middleware:", error);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
