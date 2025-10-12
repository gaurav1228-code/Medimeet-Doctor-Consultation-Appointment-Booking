// lib/client-actions.js
'use client';
import { useUser } from '@clerk/nextjs';
import { updateUserRole, updateDoctorProfile } from './actions/netlify-actions';

export function useClientActions() {
  const { user } = useUser();
  
  const handleUpdateUserRole = async (role) => {
    try {
      const result = await updateUserRole(role);
      
      if (result.success && user) {
        await user.update({
          unsafeMetadata: { 
            role, 
            onboardingCompleted: true 
          },
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error updating role:', error);
      return { success: false, error: error.message };
    }
  };
  
  const handleUpdateDoctorProfile = async (doctorData) => {
    try {
      const result = await updateDoctorProfile(doctorData);
      
      if (result.success && user) {
        await user.update({
          unsafeMetadata: { 
            role: 'DOCTOR',
            onboardingCompleted: true,
          },
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error updating doctor profile:', error);
      return { success: false, error: error.message };
    }
  };
  
  return { 
    updateUserRole: handleUpdateUserRole, 
    updateDoctorProfile: handleUpdateDoctorProfile 
  };
}
