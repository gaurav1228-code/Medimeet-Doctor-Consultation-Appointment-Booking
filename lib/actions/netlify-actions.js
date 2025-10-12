// lib/actions/netlify-actions.js
'use client';

export async function updateUserRole(role) {
  try {
    console.log("🔄 Calling update-role API...");
    
    const response = await fetch('/api/update-role', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });
    
    console.log("📊 API Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("✅ API Success response:", result);
    
    return result;
  } catch (error) {
    console.error('❌ Error updating role:', error);
    return { success: false, error: error.message };
  }
}

export async function updateDoctorProfile(doctorData) {
  try {
    console.log("🔄 Calling update-doctor-profile API...");
    
    const response = await fetch('/api/update-doctor-profile', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(doctorData),
    });
    
    console.log("📊 API Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("✅ API Success response:", result);
    
    return result;
  } catch (error) {
    console.error('❌ Error updating doctor profile:', error);
    return { success: false, error: error.message };
  }
}