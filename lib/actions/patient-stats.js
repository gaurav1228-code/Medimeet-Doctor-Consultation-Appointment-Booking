// lib/actions/patient-stats.js
'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getPatientStats() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
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

    // Get appointment statistics
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('status, start_time')
      .eq('patient_id', patientData.id);

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
    }

    const stats = {
      totalAppointments: appointments?.length || 0,
      upcomingAppointments: appointments?.filter(apt => 
        apt.status === 'SCHEDULED' && new Date(apt.start_time) > new Date()
      ).length || 0,
      completedAppointments: appointments?.filter(apt => 
        apt.status === 'COMPLETED'
      ).length || 0,
      availableCredits: patientData.credits
    };

    return { success: true, stats };
  } catch (error) {
    console.error('Error in getPatientStats:', error);
    return { success: false, error: 'Internal server error' };
  }
}
