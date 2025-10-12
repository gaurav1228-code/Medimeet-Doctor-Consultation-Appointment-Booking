// lib/actions/appointment-actions.js
'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { APPOINTMENT_CREDIT_COST, APPOINTMENT_STATUS } from '@/lib/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function cancelAppointment(appointmentId) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !userData) {
      return { success: false, error: 'User not found' };
    }

    // Get appointment with patient and doctor details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*, patient:patient_id(*), doctor:doctor_id(*)')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return { success: false, error: 'Appointment not found' };
    }

    // Verify user has permission to cancel this appointment
    const isPatient = userData.role === 'PATIENT' && appointment.patient_id === userData.id;
    const isDoctor = userData.role === 'DOCTOR' && appointment.doctor_id === userData.id;
    
    if (!isPatient && !isDoctor) {
      return { success: false, error: 'Not authorized to cancel this appointment' };
    }

    // Check if appointment can be cancelled (at least 1 hour before)
    const appointmentTime = new Date(appointment.start_time);
    const now = new Date();
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 1 && userData.role === 'PATIENT') {
      return { success: false, error: 'Appointments can only be cancelled at least 1 hour before the scheduled time' };
    }

    // Start transaction
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: APPOINTMENT_STATUS.CANCELLED,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Error cancelling appointment:', updateError);
      return { success: false, error: 'Failed to cancel appointment' };
    }

    // Refund credits to patient if they were deducted
    if (appointment.credits_deducted && !appointment.credits_refunded) {
      const { error: refundError } = await supabase
        .from('users')
        .update({
          credits: supabase.sql`credits + ${APPOINTMENT_CREDIT_COST}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointment.patient_id);

      if (refundError) {
        console.error('Error refunding credits:', refundError);
      } else {
        // Mark as refunded and create transaction record
        await supabase
          .from('appointments')
          .update({ credits_refunded: true })
          .eq('id', appointmentId);

        await supabase
          .from('credit_transactions')
          .insert({
            user_id: appointment.patient_id,
            amount: APPOINTMENT_CREDIT_COST,
            type: 'APPOINTMENT_REFUND',
            appointment_id: appointmentId,
            created_at: new Date().toISOString()
          });
      }
    }

    return { success: true, action: 'CANCELLED' };
  } catch (error) {
    console.error('Error in cancelAppointment:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function completeAppointment(appointmentId) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify the user is a doctor
    const { data: doctorData, error: doctorError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('role', 'DOCTOR')
      .single();

    if (doctorError || !doctorData) {
      return { success: false, error: 'Doctor not found' };
    }

    // Get appointment and verify ownership
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('doctor_id', doctorData.id)
      .single();

    if (appointmentError || !appointment) {
      return { success: false, error: 'Appointment not found or access denied' };
    }

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
      return { success: false, error: 'Appointment already completed' };
    }

    // Update appointment status and award credit to doctor
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: APPOINTMENT_STATUS.COMPLETED,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Error completing appointment:', updateError);
      return { success: false, error: 'Failed to complete appointment' };
    }

    // Award 1 credit to doctor (after platform fee)
    const { error: creditError } = await supabase
      .from('users')
      .update({
        credits: supabase.sql`credits + 1`,
        updated_at: new Date().toISOString()
      })
      .eq('id', doctorData.id);

    if (creditError) {
      console.error('Error awarding credit:', creditError);
    } else {
      // Create credit transaction record
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: doctorData.id,
          amount: 1,
          type: 'APPOINTMENT_EARNING',
          appointment_id: appointmentId,
          created_at: new Date().toISOString()
        });
    }

    return { success: true, action: 'COMPLETED' };
  } catch (error) {
    console.error('Error in completeAppointment:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function addAppointmentNotes(appointmentId, notes) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify the user is a doctor
    const { data: doctorData, error: doctorError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('role', 'DOCTOR')
      .single();

    if (doctorError || !doctorData) {
      return { success: false, error: 'Doctor not found' };
    }

    // Update appointment notes
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .eq('doctor_id', doctorData.id);

    if (updateError) {
      console.error('Error updating notes:', updateError);
      return { success: false, error: 'Failed to update notes' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in addAppointmentNotes:', error);
    return { success: false, error: 'Internal server error' };
  }
}
