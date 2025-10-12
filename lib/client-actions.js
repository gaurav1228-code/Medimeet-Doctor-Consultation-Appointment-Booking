// lib/client-actions.js
'use client';
import { useUser } from '@clerk/nextjs';
import { handleApiResponse } from './api-utils';

export function useClientActions() {
  const { user } = useUser();
  
  const updateUserRole = async (role) => {
    try {
      console.log("🔄 Client: Starting role update for:", role);
      
      const response = await fetch('/api/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      
      const result = await handleApiResponse(response);
      
      console.log("📊 Client: Role update API response:", result);
      
      if (result.success && user) {
        console.log("🔄 Client: Updating Clerk metadata...");
        await user.update({
          unsafeMetadata: { 
            role, 
            onboardingCompleted: true 
          },
        });
        console.log("✅ Client: Clerk metadata updated");
      }
      
      return result;
    } catch (error) {
      console.error('❌ Client: Error updating role:', error);
      return { success: false, error: error.message };
    }
  };
  
  const updateDoctorProfile = async (doctorData) => {
    try {
      console.log("🔄 Client: Starting doctor profile update");
      
      const response = await fetch('/api/update-doctor-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctorData),
      });
      
      const result = await handleApiResponse(response);
      
      console.log("📊 Client: Doctor profile update API response:", result);
      
      if (result.success && user) {
        console.log("🔄 Client: Updating Clerk metadata for doctor...");
        await user.update({
          unsafeMetadata: { 
            role: 'DOCTOR',
            onboardingCompleted: true,
          },
        });
        console.log("✅ Client: Clerk metadata updated for doctor");
      }
      
      return result;
    } catch (error) {
      console.error('❌ Client: Error updating doctor profile:', error);
      return { success: false, error: error.message };
    }
  };
  
  return { updateUserRole, updateDoctorProfile };
}