// components/AuthRedirect.jsx
"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";

export default function AuthRedirect() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && user) {
      const userRole = user.unsafeMetadata?.role;

      // Don't redirect if we're already on the correct page
      if (userRole === "PATIENT" && !pathname.startsWith("/Patient-dashboard")) {
        router.replace("/Patient-dashboard");
      } else if (userRole === "DOCTOR" && !pathname.startsWith("/Doctor-dashboard")) {
        router.replace("/Doctor-dashboard");
      } else if ((!userRole || userRole === "UNASSIGNED") && pathname !== "/RoleSelector") {
        router.replace("/RoleSelector");
      }
    }
  }, [user, isLoaded, router, pathname]);

  return null;
}
