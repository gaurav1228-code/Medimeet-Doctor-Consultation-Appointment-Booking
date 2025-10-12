// middleware.js - UPDATED FOR NETLIFY
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/Patient-dashboard(.*)",
  "/Doctor-dashboard(.*)", 
  "/RoleSelector",
  "/user-profile",
  "/admin-dashboard(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
