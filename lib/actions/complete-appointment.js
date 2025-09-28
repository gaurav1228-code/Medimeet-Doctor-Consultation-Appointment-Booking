// lib/actions/complete-appointment.js
'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function completeAppointment(appointmentId) {
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

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || appointment.doctor_id !== doctorData.id) {
      return { success: false, error: 'Appointment not found or access denied' };
    }

    if (appointment.status === 'COMPLETED') {
      return { success: false, error: 'Appointment already completed' };
    }

    // Start transaction
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ 
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        credits_awarded: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Error completing appointment:', updateError);
      return { success: false, error: 'Failed to complete appointment' };
    }

    // Award credit to doctor (1 credit per appointment after platform fee)
    const { error: creditError } = await supabase
      .from('users')
      .update({ 
        credits: supabase.sql`credits + 1`,
        updated_at: new Date().toISOString()
      })
      .eq('id', doctorData.id);

    if (creditError) {
      console.error('Error awarding credit:', creditError);
      // Continue anyway as appointment is marked completed
    }

    // Create credit transaction record
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: doctorData.id,
        amount: 1,
        type: 'APPOINTMENT_EARNING',
        appointment_id: appointmentId,
        created_at: new Date().toISOString()
      });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error in completeAppointment:', error);
    return { success: false, error: 'Internal server error' };
  }
}