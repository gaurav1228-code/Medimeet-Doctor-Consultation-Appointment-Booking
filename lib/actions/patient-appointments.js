// lib/actions/patient-appointments.js
'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getPatientAppointments() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get patient data
    const { data: patientData, error: patientError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('role', 'PATIENT')
      .single();

    if (patientError || !patientData) {
      return { success: false, error: 'Patient not found' };
    }

    // Get appointments with doctor information
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctor_id(
          id,
          name,
          email,
          specialty,
          experience
        )
      `)
      .eq('patient_id', patientData.id)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching patient appointments:', error);
      return { success: false, error: 'Failed to fetch appointments' };
    }

    return { success: true, appointments: appointments || [] };
  } catch (error) {
    console.error('Error in getPatientAppointments:', error);
    return { success: false, error: 'Internal server error' };
  }
}
