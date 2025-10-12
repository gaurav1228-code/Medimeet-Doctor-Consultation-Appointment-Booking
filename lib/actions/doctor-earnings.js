// lib/actions/doctor-earnings.js
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

    // Get completed appointments for earnings calculation
    const { data: completedAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorData.id)
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false });

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      return { success: false, error: 'Failed to fetch earnings data' };
    }

    // Calculate earnings metrics
    const completedCount = completedAppointments?.length || 0;
    
    // This month's earnings
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const thisMonthAppointments = completedAppointments?.filter(apt => 
      new Date(apt.completed_at) >= currentMonthStart
    ) || [];
    
    const thisMonthEarnings = thisMonthAppointments.length * DOCTOR_EARNINGS_PER_CREDIT;

    // Average monthly earnings (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentAppointments = completedAppointments?.filter(apt => 
      new Date(apt.completed_at) >= threeMonthsAgo
    ) || [];
    
    const averageEarningsPerMonth = recentAppointments.length > 0 
      ? Math.round((recentAppointments.length * DOCTOR_EARNINGS_PER_CREDIT) / 3) 
      : 0;

    // Available credits and payout
    const availableCredits = doctorData.credits;
    const availablePayout = availableCredits * DOCTOR_EARNINGS_PER_CREDIT;

    // Get payout history
    const { data: payouts, error: payoutsError } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('doctor_id', doctorData.id)
      .order('created_at', { ascending: false });

    return {
      success: true,
      earnings: {
        thisMonthEarnings,
        completedAppointments: completedCount,
        averageEarningsPerMonth,
        availableCredits,
        availablePayout,
        totalEarnings: completedCount * DOCTOR_EARNINGS_PER_CREDIT
      },
      payouts: payouts || []
    };
  } catch (error) {
    console.error('Error in getDoctorEarnings:', error);
    return { success: false, error: 'Internal server error' };
  }
}
