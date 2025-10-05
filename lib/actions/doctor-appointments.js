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

    // Get ALL appointments for the doctor (no date filter)
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
      .order('start_time', { ascending: false }); // Most recent first

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
