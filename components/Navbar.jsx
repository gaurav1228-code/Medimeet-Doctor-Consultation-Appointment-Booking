"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRoleButton, setShowRoleButton] = useState(false);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const checkUserRole = async () => {
      console.log("🔍 Checking user role...");
      console.log("isLoaded:", isLoaded);
      console.log("user:", user);
      
      if (!isLoaded || !user) {
        console.log("❌ User not loaded yet");
        return;
      }

      console.log("✅ User loaded, ID:", user.id);

      try {
        // Add a small delay to ensure webhook has time to create user
        setTimeout(async () => {
          console.log("🔄 Querying Supabase...");
          
          const { data, error } = await supabase
            .from("users")
            .select("role, clerk_user_id, email")
            .eq("clerk_user_id", user.id)
            .single();

          console.log("📊 Supabase result:");
          console.log("- Data:", data);
          console.log("- Error:", error);
          console.log("- Role:", data?.role);

          if (error) {
            console.error("❌ Supabase error:", error);
            // If user not found, they might be newly created - show role button
            if (error.code === 'PGRST116') {
              console.log("🆕 User not found in DB yet, will show role button");
              setShowRoleButton(true);
            }
            return;
          }

          if (data?.role === "UNASSIGNED") {
            console.log("🎯 Role is UNASSIGNED, showing button");
            setShowRoleButton(true);
          } else {
            console.log("✨ Role already set:", data?.role);
            setShowRoleButton(false);
          }
        }, 2000); // 2 second delay for webhook processing
      } catch (error) {
        console.error("❌ Error checking role:", error);
      }
    };

    checkUserRole();
  }, [user, isLoaded]);

  const handleRoleSelect = async (role) => {
    if (!user) return;

    try {
      // Update role in Supabase
      const { error: supabaseError } = await supabase
        .from("users")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("clerk_user_id", user.id);

      if (supabaseError) {
        console.error("Supabase update error:", supabaseError);
        alert("Failed to update role. Please try again.");
        return;
      }

      // Update Clerk metadata
      await user.update({
        unsafeMetadata: {
          role: role,
          onboardingCompleted: true
        }
      });

      // Hide the role button
      setShowRoleButton(false);
      alert(`Welcome! You're now registered as a ${role.toLowerCase()}.`);

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
        <div className="flex items-center gap-4">
          {/* Role Selection Button - Only for signed-in users with UNASSIGNED role */}
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
                    <h3 className="font-semibold mb-3 text-gray-900">Choose your role:</h3>
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
                          <div className="font-medium text-gray-900">Patient</div>
                          <div className="text-sm text-gray-600">Looking for healthcare services</div>
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
                          <div className="font-medium text-gray-900">Doctor</div>
                          <div className="text-sm text-gray-600">Healthcare provider</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
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