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

    // Get appointments for the next 30 days AND current appointments that haven't ended yet
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
      .gte('end_time', startDate.toISOString()) // Changed from start_time to end_time
      .lt('start_time', endDate.toISOString())
      .in('status', ['SCHEDULED', 'CONFIRMED', 'COMPLETED'])
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
