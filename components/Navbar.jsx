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
import { createClient } from "@supabase/supabase-js";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "./ui/button";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function Navbar() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRoleButton, setShowRoleButton] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [credits, setCredits] = useState(0);
  const { user, isLoaded } = useUser();

  const [isOpen, setIsOpen] = React.useState(false);

  // Function to fetch credits from Supabase
  const fetchCredits = async (userId) => {
    try {
      console.log("🔍 Fetching credits for user ID:", userId);

      const { data, error } = await supabase
        .from("users")
        .select("credits")
        .eq("clerk_user_id", userId);

      if (error) {
        console.log("❌ Error fetching credits:", error);
        return 0;
      }

      // Check if user exists
      if (!data || data.length === 0) {
        console.log("⚠️ User not found in database, creating user...");
        // Create user with default credits
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([
            {
              clerk_user_id: userId,
              role: "PATIENT",
              credits: 100, // Default credits for new patients
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select("credits")
          .single();

        if (createError) {
          console.log("❌ Error creating user:", createError);
          return 0;
        }

        console.log("✅ User created with credits:", newUser?.credits);
        return newUser?.credits || 100;
      }

      console.log("✅ Credits fetched:", data[0]?.credits);
      return data[0]?.credits || 0;
    } catch (error) {
      console.error("❌ Exception fetching credits:", error);
      return 0;
    }
  };

  useEffect(() => {
    const checkUserRole = async () => {
      // Early return if not loaded yet
      if (!isLoaded) {
        return;
      }
      // If no user, reset state
      if (!user) {
        setShowRoleButton(false);
        setUserRole(null);
        setCredits(0);
        return;
      }
      // Prevent redirect if already on patient dashboard
      if (window.location.pathname === "/Patient-dashboard") {
        return;
      }

      console.log("👤 Current Clerk user ID:", user.id);
      console.log("📋 Clerk metadata:", user.unsafeMetadata);

      // Check Clerk metadata first
      const clerkRole = user.unsafeMetadata?.role;
      const onboardingCompleted = user.unsafeMetadata?.onboardingCompleted;

      if (clerkRole && clerkRole !== "UNASSIGNED" && onboardingCompleted) {
        console.log("✅ Role from Clerk metadata:", clerkRole);
        setShowRoleButton(false);
        setUserRole(clerkRole);

        // Fetch credits from Supabase only for patients
        if (clerkRole === "PATIENT") {
        // Set UI state immediately
        setIsRedirecting(true);
        setUserRole("PATIENT");
        router.push("/Patient-dashboard");
        
        // Fetch credits in background
        fetchCredits(user.id).then(credits => setCredits(credits));
        return;
      }
        return;
      }

      // If no role in Clerk metadata, check Supabase
      try {
        console.log("🔄 Checking Supabase for user role...");

        const { data, error } = await supabase
          .from("users")
          .select("role, credits")
          .eq("clerk_user_id", user.id);

        console.log("📊 Supabase response:", { data, error });

        if (error) {
          console.log("❌ Supabase error:", error);
          setShowRoleButton(true);
          setUserRole(null);
          setCredits(0);
          return;
        }

        // Check if user exists
        if (!data || data.length === 0) {
          console.log("🎯 User not found, showing role button");
          setShowRoleButton(true);
          setUserRole(null);
          setCredits(0);
          return;
        }

        const userData = data[0];
        if (userData?.role === "UNASSIGNED" || !userData?.role) {
          console.log("🎯 Role is UNASSIGNED, showing role button");
          setShowRoleButton(true);
          setUserRole(null);
          setCredits(0);
        } else {
          console.log("✅ Role from Supabase:", userData?.role);
          setUserRole(userData?.role);
          setCredits(userData?.credits || 0);
          setShowRoleButton(false);
          // Redirect to patient dashboard if role is PATIENT
          if (userData?.role === "PATIENT") {
            router.push("/Patient-dashboard");
          }
        }
      } catch (error) {
        console.error("❌ Exception checking role:", error);
        setShowRoleButton(false);
        setUserRole(null);
        setCredits(0);
      }
    };

    checkUserRole();
  }, [user, isLoaded, router]);

  const handleRoleSelect = async (role) => {
    if (!user) return;

    try {
      console.log("🎯 Selecting role:", role);

      // Check if user exists first
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      let supabaseError;

      if (existingUser) {
        // Update existing user
        const { error } = await supabase
          .from("users")
          .update({
            role,
            updated_at: new Date().toISOString(),
          })
          .eq("clerk_user_id", user.id);
        supabaseError = error;
      } else {
        // Create new user
        const { error } = await supabase.from("users").insert([
          {
            clerk_user_id: user.id,
            email: user.emailAddresses?.[0]?.emailAddress || "",
            name: user.fullName || "",
            image_url: user.imageUrl || "",
            role,
            credits: role === "PATIENT" ? 100 : 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
        supabaseError = error;
      }

      if (supabaseError) {
        console.error("❌ Supabase update error:", supabaseError);
        alert("Failed to update role. Please try again.");
        return;
      }

      // Update Clerk metadata
      await user.update({
        unsafeMetadata: {
          role: role,
          onboardingCompleted: true,
        },
      });

      // Update local state
      setUserRole(role);
      setShowRoleButton(false);

      // If user selected PATIENT, set initial credits
      if (role === "PATIENT") {
        setCredits(100); // Set default credits immediately
        // Then fetch actual credits from database
        const userCredits = await fetchCredits(user.id);
        setCredits(userCredits);
        router.push("/Patient-dashboard");
      }

      alert(`Welcome! You're now registered as a ${role.toLowerCase()}.`);
    } catch (error) {
      console.error("❌ Error updating role:", error);
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
          {/* Role Selection Button */}
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
                          href = "";
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

            {/* Credits Button - Only for patients */}
            {userRole === "PATIENT" && (
              <div className="flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                <span className="text-sm font-medium text-blue-700">
                  💳 Credits: {credits}
                </span>
              </div>
            )}
            {userRole === "PATIENT" && (
              <Collapsible
                open={isOpen}
                onOpenChange={setIsOpen}
                className="relative"
              >
                {/* Trigger Button */}
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="rounded-full hover:bg-gray-200 h-12 w-12"
                  >
                    <Menu className="h-12 w-12 text-white" strokeWidth={3} />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </CollapsibleTrigger>

                {/* Dropdown Content */}
                <CollapsibleContent className="absolute right-0 top-14 w-48 mt-2 p-2 space-y-2 rounded-lg border bg-muted shadow-lg animate-in slide-in-from-top-7">
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-md hover:bg-blue-50 hover:text-blue-600"
                  >
                    My Appointments
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-md hover:bg-green-50 hover:text-green-600"
                  >
                    Medical History
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            )}

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

      {/* Overlay to close menu when clicking outside */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </div>
  );
}

export default Navbar;
