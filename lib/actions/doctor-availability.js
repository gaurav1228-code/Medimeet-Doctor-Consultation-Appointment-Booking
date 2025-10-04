// lib/actions/doctor-availability.js
'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Make sure this function is exported
export async function getDoctorAvailability() {
  console.log('🔄 getDoctorAvailability called');
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.log('❌ No user ID found');
      return { success: false, error: 'Not authenticated' };
    }

    // Get doctor ID
    const { data: doctorData, error: doctorError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('role', 'DOCTOR')
      .single();

    if (doctorError || !doctorData) {
      console.log('❌ Doctor not found:', doctorError);
      return { success: false, error: 'Doctor not found' };
    }

    console.log('👨‍⚕️ Doctor found:', doctorData.id);

    // Get availability slots for next 7 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const { data: availability, error } = await supabase
      .from('availability')
      .select('*')
      .eq('doctor_id', doctorData.id)
      .gte('start_time', startDate.toISOString())
      .lt('start_time', endDate.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.log('❌ Error fetching availability:', error);
      return { success: false, error: 'Failed to fetch availability' };
    }

    console.log(`📊 Found ${availability?.length || 0} availability slots`);

    // Format the data
    const slots = availability?.map(slot => ({
      id: slot.id,
      startTime: slot.start_time,
      endTime: slot.end_time,
      status: slot.status
    })) || [];

    return { success: true, slots };
  } catch (error) {
    console.error('❌ Error in getDoctorAvailability:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function setAvailabilitySlots(formData) {
  console.log('🔄 setAvailabilitySlots called');
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.log('❌ No user ID found');
      return { success: false, error: 'Not authenticated' };
    }

    const startTime = formData.get('startTime');
    const endTime = formData.get('endTime');

    console.log('📅 Received times:', { startTime, endTime });

    if (!startTime || !endTime) {
      console.log('❌ Missing start or end time');
      return { success: false, error: 'Start time and end time are required' };
    }

    // Get doctor ID
    const { data: doctorData, error: doctorError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('role', 'DOCTOR')
      .single();

    if (doctorError || !doctorData) {
      console.log('❌ Doctor not found:', doctorError);
      return { success: false, error: 'Doctor not found' };
    }

    console.log('👨‍⚕️ Doctor found:', doctorData.id);

    // Parse the times
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    console.log('📊 Parsed dates:', { startDate, endDate });

    if (startDate >= endDate) {
      console.log('❌ End time must be after start time');
      return { success: false, error: 'End time must be after start time' };
    }

    // Extract time components
    const startHours = startDate.getHours();
    const startMinutes = startDate.getMinutes();
    const endHours = endDate.getHours();
    const endMinutes = endDate.getMinutes();

    console.log('⏰ Time components:', { startHours, startMinutes, endHours, endMinutes });

    // Create daily slots for the next 7 days
    const slots = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() + i);

      const slotStart = new Date(currentDate);
      slotStart.setHours(startHours, startMinutes, 0, 0);

      const slotEnd = new Date(currentDate);
      slotEnd.setHours(endHours, endMinutes, 0, 0);

      // Only create future slots
      const now = new Date();
      if (slotStart > now) {
        slots.push({
          doctor_id: doctorData.id,
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
          status: 'AVAILABLE',
          created_at: new Date().toISOString()
        });
      }
    }

    console.log(`📅 Created ${slots.length} slots for the next 7 days`);

    if (slots.length === 0) {
      console.log('❌ No valid slots to create');
      return { success: false, error: 'No valid time slots to create' };
    }

    // Delete existing future slots for this doctor
    const { error: deleteError } = await supabase
      .from('availability')
      .delete()
      .eq('doctor_id', doctorData.id)
      .gte('start_time', new Date().toISOString());

    if (deleteError) {
      console.error('❌ Error deleting old slots:', deleteError);
    } else {
      console.log('✅ Old slots deleted successfully');
    }

    // Insert new slots
    const { error: insertError } = await supabase
      .from('availability')
      .insert(slots);

    if (insertError) {
      console.error('❌ Error inserting slots:', insertError);
      return { success: false, error: 'Failed to set availability: ' + insertError.message };
    }

    console.log('✅ Availability slots saved successfully!');
    return { success: true, slotsCount: slots.length };

  } catch (error) {
    console.error('❌ Error in setAvailabilitySlots:', error);
    return { success: false, error: 'Internal server error: ' + error.message };
  }
}
