// components/NavbarClient.jsx
"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "./ui/button";
import { updateSupabaseUserClient, getSupabaseUserClient } from "@/lib/supabase-client";
import { updateSupabaseUser } from "@/app/actions/user-actions";

function NavbarClient({ 
  userId,
  initialSupabaseUser, 
  initialCredits, 
  initialUserRole, 
  initialShowRoleButton 
}) {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRoleButton, setShowRoleButton] = useState(initialShowRoleButton);
  const [userRole, setUserRole] = useState(initialUserRole);
  const [credits, setCredits] = useState(initialCredits);
  const { user: clerkUser, isLoaded } = useUser();

  const user = clerkUser || (userId ? { id: userId } : null);
  const [isOpen, setIsOpen] = React.useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!isLoaded || !user) {
        setShowRoleButton(false);
        setUserRole(null);
        setCredits(0);
        return;
      }

      if (window.location.pathname === "/Patient-dashboard") {
        return;
      }

      const clerkRole = clerkUser?.unsafeMetadata?.role;
      const onboardingCompleted = clerkUser?.unsafeMetadata?.onboardingCompleted;

      if (clerkRole && clerkRole !== "UNASSIGNED" && onboardingCompleted) {
        setShowRoleButton(false);
        setUserRole(clerkRole);

        if (clerkRole === "PATIENT") {
          setIsRedirecting(true);
          setUserRole("PATIENT");
          router.push("/Patient-dashboard");
          
          const userCredits = await fetchCredits(user.id);
          setCredits(userCredits);
        }
        return;
      }

      // If we don't have initial data, fetch from client
      if (initialUserRole === undefined) {
        try {
          const userData = await getSupabaseUserClient(user.id);
          
          if (!userData || userData.role === "UNASSIGNED" || !userData.role) {
            setShowRoleButton(true);
            setUserRole(null);
            setCredits(0);
          } else {
            setUserRole(userData.role);
            setCredits(userData.credits || 0);
            setShowRoleButton(false);
            
            if (userData.role === "PATIENT") {
              router.push("/Patient-dashboard");
            }
          }
        } catch (error) {
          console.error("Error checking role:", error);
          setShowRoleButton(false);
          setUserRole(null);
          setCredits(0);
        }
      }
    };

    checkUserRole();
  }, [user, isLoaded, router, initialUserRole, clerkUser]);

  const fetchCredits = async (userId) => {
    try {
      const userData = await getSupabaseUserClient(userId);
      return userData?.credits || 0;
    } catch (error) {
      console.error("Error fetching credits:", error);
      return 0;
    }
  };

  const handleRoleSelect = async (role) => {
    if (!user) return;

    try {
      // Use server action for better security
      const updatedUser = await updateSupabaseUser(user.id, {
        role,
        updated_at: new Date().toISOString(),
        ...(role === "PATIENT" && { credits: 100 })
      });

      if (!updatedUser) {
        throw new Error("Failed to update Supabase");
      }

      // Update Clerk metadata if we have the clerk user object
      if (clerkUser) {
        await clerkUser.update({
          unsafeMetadata: {
            role: role,
            onboardingCompleted: true,
          },
        });
      }

      setUserRole(role);
      setShowRoleButton(false);

      if (role === "PATIENT") {
        setCredits(100);
        router.push("/Patient-dashboard");
      }

    } catch (error) {
      console.error("Error updating role:", error);
      alert("Error updating role. Please try again.");
    }
  };
  return (
    <div className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-10 supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto pl-6 pr-6 h-20 flex justify-between items-center">
        {/* Logo */}
        <Link href="/">
          <img
            className="h-10 w-auto object-cover"
            src="/logo-single.png"
            alt="Logo"
            width={200}
            height={60}
          />
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-6">
          <SignedIn>
            {showRoleButton && (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                  Select Your Role
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-12 w-64 p-4 bg-white border rounded-lg shadow-lg z-50">
                    <h3 className="font-semibold mb-3 text-gray-900">
                      Choose your role:
                    </h3>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          handleRoleSelect("PATIENT");
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center p-3 text-left hover:bg-blue-50 rounded-md border"
                      >
                        <span className="text-xl mr-3">👤</span>
                        <div>
                          <div className="font-medium text-gray-900">
                            Patient
                          </div>
                          <div className="text-sm text-gray-600">
                            Looking for healthcare services
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          handleRoleSelect("DOCTOR");
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center p-3 text-left hover:bg-green-50 rounded-md border"
                      >
                        <span className="text-xl mr-3">👨‍⚕️</span>
                        <div>
                          <div className="font-medium text-gray-900">
                            Doctor
                          </div>
                          <div className="text-sm text-gray-600">
                            Healthcare provider
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {userRole === "PATIENT" && (
              <div className="flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                <span className="text-sm font-medium text-blue-700">
                  💳 Credits: {credits}
                </span>
              </div>
            )}
            
            {/* ... rest of your Navbar code ... */}
            <UserButton />
          </SignedIn>

          <SignedOut>
            <div className="flex gap-2">
              <SignUpButton mode="redirect" forceRedirectUrl="/">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                  Sign Up
                </button>
              </SignUpButton>

              <SignInButton mode="redirect" forceRedirectUrl="/">
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </SignedOut>
        </div>
      </nav>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </div>
  );
}

export default NavbarClient;