// lib/actions/doctor-earnings.js - IMPROVED
'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { DOCTOR_EARNINGS_PER_CREDIT } from '@/lib/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getDoctorEarnings() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get doctor data
    const { data: doctorData, error: doctorError } = await supabase
      .from('users')
      .select('id, credits, name')
      .eq('clerk_user_id', userId)
      .eq('role', 'DOCTOR')
      .single();

    if (doctorError || !doctorData) {
      return { success: false, error: 'Doctor not found' };
    }

    // Get credit transactions for accurate earnings calculation
    const { data: creditTransactions, error: transactionsError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', doctorData.id)
      .eq('type', 'APPOINTMENT_EARNING');

    // Get appointments for statistics
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorData.id);

    // Get payout requests
    const { data: payouts, error: payoutsError } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('doctor_id', doctorData.id)
      .order('created_at', { ascending: false });

    // Calculate earnings from credit transactions (most accurate)
    const totalCreditsEarned = creditTransactions?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
    const totalEarnings = totalCreditsEarned * DOCTOR_EARNINGS_PER_CREDIT;

    // This month's earnings
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const thisMonthTransactions = creditTransactions?.filter(transaction => 
      new Date(transaction.created_at) >= currentMonthStart
    ) || [];
    
    const thisMonthEarnings = thisMonthTransactions.reduce((sum, transaction) => sum + transaction.amount, 0) * DOCTOR_EARNINGS_PER_CREDIT;

    // Appointment statistics
    const totalAppointments = appointments?.length || 0;
    const scheduledAppointments = appointments?.filter(apt => apt.status === 'SCHEDULED').length || 0;
    const completedAppointments = appointments?.filter(apt => apt.status === 'COMPLETED').length || 0;
    const cancelledAppointments = appointments?.filter(apt => apt.status === 'CANCELLED').length || 0;

    // Available credits and payout (current balance)
    const availableCredits = doctorData.credits;
    const availablePayout = availableCredits * DOCTOR_EARNINGS_PER_CREDIT;

    // Average monthly earnings (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentTransactions = creditTransactions?.filter(transaction => 
      new Date(transaction.created_at) >= threeMonthsAgo
    ) || [];
    
    const averageEarningsPerMonth = recentTransactions.length > 0 
      ? (recentTransactions.reduce((sum, transaction) => sum + transaction.amount, 0) * DOCTOR_EARNINGS_PER_CREDIT) / 3 
      : 0;

    return {
      success: true,
      earnings: {
        thisMonthEarnings,
        totalAppointments,
        scheduledAppointments,
        completedAppointments,
        cancelledAppointments,
        averageEarningsPerMonth,
        availableCredits,
        availablePayout,
        totalEarnings,
        totalCreditsEarned
      },
      payouts: payouts || []
    };
  } catch (error) {
    console.error('Error in getDoctorEarnings:', error);
    return { success: false, error: 'Internal server error' };
  }
}
