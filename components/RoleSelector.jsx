// components/RoleSelector.jsx
"use client";

import { useState } from "react";
import { useClientActions } from "@/lib/client-actions";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

function RoleSelector() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  const { updateUserRole } = useClientActions();

  const handleRoleSelect = async (role) => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      console.log("🔄 Starting role selection for:", role);
      
      // Update role using client action
      const result = await updateUserRole(role);
      
      console.log("📊 Role update result:", result);
      
      if (!result.success) {
        alert(`Failed to update role: ${result.error}`);
        return;
      }

      // Update Clerk metadata
      console.log("🔄 Updating Clerk metadata...");
      await user.update({
        unsafeMetadata: {
          role: role,
          onboardingCompleted: true,
        },
      });
      
      console.log("✅ Clerk metadata updated");

      // Close menu
      setIsMenuOpen(false);

      // Redirect based on role
      // Force a hard refresh to ensure middleware picks up the new role
    console.log("🔀 Redirecting...");
    window.location.href = role === "PATIENT" 
      ? "/Patient-dashboard" 
      : "/Doctor-dashboard";
      

      // alert(`Welcome! You're now registered as a ${role.toLowerCase()}.`);
      
    } catch (error) {
      console.error("❌ Error updating role:", error);
      alert("Error updating role. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        disabled={isLoading}
        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
      >
        {isLoading ? "Setting up..." : "Select Your Role"}
      </button>

      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-12 w-64 p-4 bg-white border rounded-lg shadow-lg z-50">
            <h3 className="font-semibold mb-3 text-gray-900">
              Choose your role:
            </h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleRoleSelect("PATIENT")}
                disabled={isLoading}
                className="flex items-center p-3 text-left hover:bg-blue-50 rounded-md border disabled:opacity-50"
              >
                <span className="text-xl mr-3">👤</span>
                <div>
                  <div className="font-medium text-gray-900">Patient</div>
                  <div className="text-sm text-gray-600">
                    Looking for healthcare services
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect("DOCTOR")}
                disabled={isLoading}
                className="flex items-center p-3 text-left hover:bg-green-50 rounded-md border disabled:opacity-50"
              >
                <span className="text-xl mr-3">👨‍⚕️</span>
                <div>
                  <div className="font-medium text-gray-900">Doctor</div>
                  <div className="text-sm text-gray-600">
                    Healthcare provider
                  </div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default RoleSelector;
