// lib/actions/doctor-earnings.js
'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

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

    // Get doctor ID and credits
    const { data: doctorData, error: doctorError } = await supabase
      .from('users')
      .select('id, credits')
      .eq('clerk_user_id', userId)
      .eq('role', 'DOCTOR')
      .single();

    if (doctorError || !doctorData) {
      return { success: false, error: 'Doctor not found' };
    }

    // Get completed appointments (where credits were awarded)
    const { data: completedAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorData.id)
      .eq('status', 'COMPLETED')
      .eq('credits_awarded', true)
      .order('completed_at', { ascending: false });

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      return { success: false, error: 'Failed to fetch earnings data' };
    }

    // Calculate earnings
    const completedCount = completedAppointments?.length || 0;
    
    // Each completed appointment earns 1 credit = $8 (after platform fee)
    const totalEarnings = completedCount * 8;
    const availableCredits = doctorData.credits;
    const availablePayout = availableCredits * 8;

    // Calculate this month's earnings
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const thisMonthAppointments = completedAppointments?.filter(apt => 
      new Date(apt.completed_at) >= currentMonthStart
    ) || [];
    
    const thisMonthEarnings = thisMonthAppointments.length * 8;

    // Calculate average monthly earnings (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentAppointments = completedAppointments?.filter(apt => 
      new Date(apt.completed_at) >= threeMonthsAgo
    ) || [];
    
    const averageEarningsPerMonth = recentAppointments.length > 0 
      ? Math.round((recentAppointments.length * 8) / 3) 
      : 0;

    // Get payout history
    const { data: payouts, error: payoutsError } = await supabase
      .from('payouts')
      .select('*')
      .eq('doctor_id', doctorData.id)
      .order('created_at', { ascending: false });

    if (payoutsError) {
      console.error('Error fetching payouts:', payoutsError);
    }

    return {
      success: true,
      earnings: {
        thisMonthEarnings,
        completedAppointments: completedCount,
        averageEarningsPerMonth,
        availableCredits,
        availablePayout,
        totalEarnings
      },
      payouts: payouts || [],
      recentAppointments: completedAppointments?.slice(0, 5) || []
    };
  } catch (error) {
    console.error('Error in getDoctorEarnings:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function requestPayout(formData) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const paypalEmail = formData.get('paypalEmail');

    if (!paypalEmail) {
      return { success: false, error: 'PayPal email is required' };
    }

    // Get doctor data
    const { data: doctorData, error: doctorError } = await supabase
      .from('users')
      .select('id, credits')
      .eq('clerk_user_id', userId)
      .eq('role', 'DOCTOR')
      .single();

    if (doctorError || !doctorData) {
      return { success: false, error: 'Doctor not found' };
    }

    if (doctorData.credits <= 0) {
      return { success: false, error: 'No credits available for payout' };
    }

    // Check for pending payouts
    const { data: pendingPayout, error: pendingError } = await supabase
      .from('payouts')
      .select('id')
      .eq('doctor_id', doctorData.id)
      .eq('status', 'PROCESSING')
      .single();

    if (pendingPayout) {
      return { success: false, error: 'You already have a pending payout request' };
    }

    // Calculate payout amounts
    const credits = doctorData.credits;
    const amount = credits * 10; // $10 per credit (gross)
    const platformFee = credits * 2; // $2 platform fee per credit
    const netAmount = amount - platformFee;

    // Create payout request
    const { error: payoutError } = await supabase
      .from('payouts')
      .insert({
        doctor_id: doctorData.id,
        amount,
        credits,
        platform_fee: platformFee,
        net_amount: netAmount,
        paypal_email: paypalEmail,
        status: 'PROCESSING',
        created_at: new Date().toISOString()
      });

    if (payoutError) {
      console.error('Error creating payout request:', payoutError);
      return { success: false, error: 'Failed to create payout request' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in requestPayout:', error);
    return { success: false, error: 'Internal server error' };
  }
}
