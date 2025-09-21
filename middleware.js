// middleware.js
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const isProtectedRoute = createRouteMatcher([
  "/Patient-dashboard(.*)",
  "/Doctor-dashboard(.*)", 
  "/RoleSelector",
  "/user-profile",
  "/admin-dashboard(.*)"
]);

const publicRoutes = ["/", "/api/", "/_next/", "/sign-in", "/sign-up"];

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

    
    // Get user verification status from Supabas
    let supabaseRole = null;
  
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('clerk_user_id', userId)
        .single();
      
      supabaseRole = userData?.role;
      
      // If user has no role in Supabase but has role in Clerk metadata, update Supabase
      if (userRole && (!supabaseRole || supabaseRole === 'UNASSIGNED')) {
        await supabase
          .from('users')
          .update({ role: userRole })
          .eq('clerk_user_id', userId);
      }

      // ADMIN REDIRECTION LOGIC
      if (supabaseRole === 'ADMIN' && !pathname.startsWith('/admin-dashboard')) {
        return NextResponse.redirect(new URL('/admin-dashboard', req.url));
      }
      
      if (pathname.startsWith('/admin-dashboard') && supabaseRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url));
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
    }

    // Check if doctor is fully verified (all documents verified)
    const isFullyVerified = verificationStatus === 'VERIFIED' && 
                           aadhaarVerified && 
                           panVerified && 
                           medicalLicenseVerified;

    // Check if user has uploaded any documents
    const hasUploadedDocuments = documentUrls && documentUrls.length > 0;

    // If user has no role and is not on RoleSelector, redirect
    if ((!supabaseRole || supabaseRole === 'UNASSIGNED') && pathname !== '/RoleSelector') {
      return NextResponse.redirect(new URL('/RoleSelector', req.url));
    }
    
    // If user has a role and is on RoleSelector, redirect to appropriate dashboard
    if ((supabaseRole === 'PATIENT' || supabaseRole === 'DOCTOR') && pathname === '/RoleSelector') {
      // For doctors, check verification status and documents
      if (supabaseRole === 'DOCTOR') {
        if (isFullyVerified) {
          return NextResponse.redirect(new URL('/Doctor-dashboard', req.url));
        } else if (hasUploadedDocuments) {
          return NextResponse.redirect(new URL('/Doctor-dashboard/verification', req.url));
        } else {
          return NextResponse.redirect(new URL('/user-profile', req.url));
        }
      }
      return NextResponse.redirect(new URL(`/${supabaseRole.toLowerCase()}-dashboard`, req.url));
    }
    
    // Handle doctor-specific routing based on verification status
    if (supabaseRole === 'DOCTOR') {
      // Redirect doctors who just completed onboarding to verification page
      if (pathname === '/RoleSelector' && hasUploadedDocuments) {
        return NextResponse.redirect(new URL('/Doctor-dashboard/verification', req.url));
      }
      
      // Redirect fully verified doctors to dashboard
      if (isFullyVerified && pathname.startsWith('/Doctor-dashboard/verification')) {
        return NextResponse.redirect(new URL('/Doctor-dashboard', req.url));
      }
      
      // Redirect doctors trying to access dashboard without being fully verified
      if (!isFullyVerified && pathname === '/Doctor-dashboard') {
        if (hasUploadedDocuments) {
          return NextResponse.redirect(new URL('/Doctor-dashboard/verification', req.url));
        } else {
          return NextResponse.redirect(new URL('/user-profile', req.url));
        }
      }
    }
    
    // Role-based access control
    if (pathname.startsWith('/Patient-dashboard') && supabaseRole !== 'PATIENT') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    if (pathname.startsWith('/Doctor-dashboard') && supabaseRole !== 'DOCTOR') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // Redirect patients away from doctor-specific pages
    if (supabaseRole === 'PATIENT' && pathname.startsWith('/Doctor-dashboard')) {
      return NextResponse.redirect(new URL('/Patient-dashboard', req.url));
    }
    
    // Redirect doctors away from patient-specific pages
    if (supabaseRole === 'DOCTOR' && pathname.startsWith('/Patient-dashboard')) {
      return NextResponse.redirect(new URL('/Doctor-dashboard', req.url));
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
