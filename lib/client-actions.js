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
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response. Please check the API endpoint.');
      }
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }
      
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
      return { 
        success: false, 
        error: error.message || 'Failed to update role' 
      };
    }
  };
  
  return { updateUserRole };
}
