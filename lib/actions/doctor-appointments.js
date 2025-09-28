// lib/actions/doctor-appointments.js
'use server';

import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase-client';



export async function getDoctorAppointments() {
  try {
    const { userId } = await auth();
    const supabase = createServerClient();
    
    if (!userId) {
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
      return { success: false, error: 'Doctor not found' };
    }

    // Get appointments for the next 30 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patient_id(
          name,
          email
        )
      `)
      .eq('doctor_id', doctorData.id)
      .gte('start_time', startDate.toISOString())
      .lt('start_time', endDate.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return { success: false, error: 'Failed to fetch appointments' };
    }

    return { success: true, appointments: appointments || [] };
  } catch (error) {
    console.error('Error in getDoctorAppointments:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function updateAppointmentStatus(appointmentId, status) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify the doctor owns this appointment
    const { data: doctorData, error: doctorError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('role', 'DOCTOR')
      .single();

    if (doctorError || !doctorData) {
      return { success: false, error: 'Doctor not found' };
    }

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('doctor_id')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || appointment.doctor_id !== doctorData.id) {
      return { success: false, error: 'Appointment not found or access denied' };
    }

    // Update appointment status
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      return { success: false, error: 'Failed to update appointment' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateAppointmentStatus:', error);
    return { success: false, error: 'Internal server error' };
  }
}
