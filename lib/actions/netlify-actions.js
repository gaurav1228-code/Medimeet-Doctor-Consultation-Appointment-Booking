// lib/actions/netlify-actions.js
'use client';

export async function updateUserRole(role) {
  try {
    const response = await fetch('/api/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating role:', error);
    return { success: false, error: error.message };
  }
}

export async function updateDoctorProfile(doctorData) {
  try {
    const response = await fetch('/api/update-doctor-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    return { success: false, error: error.message };
  }
}