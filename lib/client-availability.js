// lib/client-availability.js (Client-side only)
'use client';

export async function setAvailabilitySlotsClient(formData) {
  try {
    console.log('🔄 Client: Setting availability slots...');
    
    const response = await fetch('/api/doctor/availability/set', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to set availability');
    }

    console.log('✅ Client: Availability set successfully');
    return result;
  } catch (error) {
    console.error('❌ Client: Error setting availability:', error);
    throw error;
  }
}

export async function getDoctorAvailabilityClient() {
  try {
    console.log('🔄 Client: Getting availability...');
    
    const response = await fetch('/api/doctor/availability');
    
    if (!response.ok) {
      throw new Error('Failed to fetch availability');
    }

    const result = await response.json();
    console.log('✅ Client: Availability fetched successfully');
    return result;
  } catch (error) {
    console.error('❌ Client: Error fetching availability:', error);
    throw error;
  }
}