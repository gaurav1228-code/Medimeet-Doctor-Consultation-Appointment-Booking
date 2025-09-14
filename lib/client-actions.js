// lib/client-actions.js
'use client';

import { useUser } from '@clerk/nextjs';

// Client-side version of updateUserRole
export function useClientActions() {
  const { user } = useUser();
  
  const updateUserRole = async (role) => {
    try {
      const response = await fetch('/api/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });
      
      const result = await response.json();
      
      if (result.success && user) {
        // Update Clerk metadata
        await user.update({
          unsafeMetadata: {
            role: role,
            onboardingCompleted: true,
          },
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error updating role:', error);
      return { success: false, error: error.message };
    }
  };
  
  return { updateUserRole };
}