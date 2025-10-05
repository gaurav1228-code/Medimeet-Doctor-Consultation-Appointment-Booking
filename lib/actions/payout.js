// lib/actions/payout.js
'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { CREDIT_VALUE_USD, PLATFORM_FEE_PER_CREDIT, DOCTOR_EARNINGS_PER_CREDIT, PAYOUT_STATUS } from '@/lib/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
      .select('id, credits, name')
      .eq('clerk_user_id', userId)
      .eq('role', 'DOCTOR')
      .single();

    if (doctorError || !doctorData) {
      return { success: false, error: 'Doctor not found' };
    }

    if (doctorData.credits <= 0) {
      return { success: false, error: 'No credits available for payout' };
    }

    // Check for pending payout requests
    const { data: pendingPayout, error: pendingError } = await supabase
      .from('payout_requests')
      .select('id')
      .eq('doctor_id', doctorData.id)
      .eq('status', PAYOUT_STATUS.PENDING)
      .single();

    if (pendingPayout) {
      return { success: false, error: 'You already have a pending payout request' };
    }

    // Calculate payout amounts
    const credits = doctorData.credits;
    const amount = credits * CREDIT_VALUE_USD;
    const platformFee = credits * PLATFORM_FEE_PER_CREDIT;
    const netAmount = credits * DOCTOR_EARNINGS_PER_CREDIT;

    // Create payout request
    const { error: payoutError } = await supabase
      .from('payout_requests')
      .insert({
        doctor_id: doctorData.id,
        credits,
        amount,
        platform_fee: platformFee,
        net_amount: netAmount,
        paypal_email: paypalEmail,
        status: PAYOUT_STATUS.PENDING,
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

export async function getDoctorPayouts() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get doctor data
    const { data: doctorData, error: doctorError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('role', 'DOCTOR')
      .single();

    if (doctorError || !doctorData) {
      return { success: false, error: 'Doctor not found' };
    }

    // Get payout history
    const { data: payouts, error } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('doctor_id', doctorData.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payouts:', error);
      return { success: false, error: 'Failed to fetch payouts' };
    }

    return { success: true, payouts: payouts || [] };
  } catch (error) {
    console.error('Error in getDoctorPayouts:', error);
    return { success: false, error: 'Internal server error' };
  }
}