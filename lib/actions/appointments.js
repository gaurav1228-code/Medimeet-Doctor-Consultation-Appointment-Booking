// lib/actions/appointments.js
'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { APPOINTMENT_CREDIT_COST } from '@/lib/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function bookAppointment(formData) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const doctorId = formData.get('doctorId');
    const startTime = formData.get('startTime');
    const endTime = formData.get('endTime');
    const description = formData.get('description');

    if (!doctorId || !startTime || !endTime) {
      return { success: false, error: 'Missing required fields' };
    }

    // Get patient data
    const { data: patientData, error: patientError } = await supabase
      .from('users')
      .select('id, credits')
      .eq('clerk_user_id', userId)
      .eq('role', 'PATIENT')
      .single();

    if (patientError || !patientData) {
      return { success: false, error: 'Patient not found' };
    }

    // Check if patient has enough credits
    if (patientData.credits < APPOINTMENT_CREDIT_COST) {
      return { success: false, error: 'Insufficient credits' };
    }

    // Verify the time slot is available
    const { data: availability, error: availabilityError } = await supabase
      .from('availability')
      .select('id, doctor_id, status')
      .eq('id', doctorId) // Using availability slot ID
      .eq('status', 'AVAILABLE')
      .single();

    if (availabilityError || !availability) {
      return { success: false, error: 'Time slot not available' };
    }

    // Check for conflicting appointments
    const { data: conflictingAppointment, error: conflictError } = await supabase
      .from('appointments')
      .select('id')
      .or(`doctor_id.eq.${doctorId},patient_id.eq.${patientData.id}`)
      .eq('start_time', startTime)
      .single();

    if (conflictingAppointment) {
      return { success: false, error: 'Time slot is already booked' };
    }

    // Start transaction
    const { error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        patient_id: patientData.id,
        doctor_id: availability.doctor_id,
        start_time: startTime,
        end_time: endTime,
        status: 'SCHEDULED',
        patient_description: description,
        created_at: new Date().toISOString()
      });

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError);
      return { success: false, error: 'Failed to book appointment' };
    }

    // Update availability slot status
    const { error: availabilityUpdateError } = await supabase
      .from('availability')
      .update({ status: 'BOOKED' })
      .eq('id', availability.id);

    if (availabilityUpdateError) {
      console.error('Error updating availability:', availabilityUpdateError);
      // Continue anyway as appointment is created
    }

    // Deduct credits from patient
    const { error: creditError } = await supabase
      .from('users')
      .update({ 
        credits: patientData.credits - APPOINTMENT_CREDIT_COST,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientData.id);

    if (creditError) {
      console.error('Error deducting credits:', creditError);
      // Continue anyway as appointment is created
    }

    // Add credits to doctor (will be processed after appointment completion)
    // This happens when doctor marks appointment as completed

    return { success: true };
  } catch (error) {
    console.error('Error in bookAppointment:', error);
    return { success: false, error: 'Internal server error' };
  }
}
