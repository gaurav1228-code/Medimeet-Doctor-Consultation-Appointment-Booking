// lib/actions/debug-appointments.js
'use server';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function debugAppointments() {
  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      appointments: appointments.map(apt => ({
        id: apt.id,
        patient_id: apt.patient_id,
        doctor_id: apt.doctor_id,
        start_time: apt.start_time,
        status: apt.status,
        video_session_id: apt.video_session_id,
        video_session_token: apt.video_session_token ? 'YES' : 'NO',
        created_at: apt.created_at
      }))
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
