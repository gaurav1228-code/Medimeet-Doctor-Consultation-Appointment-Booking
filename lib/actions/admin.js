//  lib/actions/admin.js
'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { PAYOUT_STATUS } from '@/lib/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function approvePayout(formData) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single();

    if (adminError || !adminUser || adminUser.role !== 'ADMIN') {
      return { success: false, error: 'Admin access required' };
    }

    const payoutId = formData.get('payoutId');

    if (!payoutId) {
      return { success: false, error: 'Payout ID is required' };
    }

    // Get payout request with doctor details
    const { data: payout, error: payoutError } = await supabase
      .from('payout_requests')
      .select('*, doctor:doctor_id(*)')
      .eq('id', payoutId)
      .eq('status', PAYOUT_STATUS.PENDING)
      .single();

    if (payoutError || !payout) {
      return { success: false, error: 'Payout request not found or already processed' };
    }

    // Check if doctor has enough credits
    if (payout.doctor.credits < payout.credits) {
      return { success: false, error: 'Doctor does not have enough credits' };
    }

    // Process payout in transaction
    const { error: updateError } = await supabase
      .from('payout_requests')
      .update({
        status: PAYOUT_STATUS.APPROVED,
        processed_at: new Date().toISOString(),
        processed_by: adminUser.id
      })
      .eq('id', payoutId);

    if (updateError) {
      console.error('Error approving payout:', updateError);
      return { success: false, error: 'Failed to approve payout' };
    }

    // Deduct credits from doctor
    const { error: creditError } = await supabase
      .from('users')
      .update({
        credits: supabase.sql`credits - ${payout.credits}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', payout.doctor_id);

    if (creditError) {
      console.error('Error deducting credits:', creditError);
      return { success: false, error: 'Failed to deduct credits' };
    }

    // Create credit transaction record
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: payout.doctor_id,
        amount: -payout.credits,
        type: 'PAYOUT',
        created_at: new Date().toISOString()
      });

    return { success: true };
  } catch (error) {
    console.error('Error in approvePayout:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function getPendingPayouts() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_user_id', userId)
      .single();

    if (adminError || !adminUser || adminUser.role !== 'ADMIN') {
      return { success: false, error: 'Admin access required' };
    }

    // Get pending payouts with doctor information
    const { data: payouts, error } = await supabase
      .from('payout_requests')
      .select(`
        *,
        doctor:doctor_id(
          id,
          name,
          email,
          specialty,
          credits
        )
      `)
      .eq('status', PAYOUT_STATUS.PENDING)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending payouts:', error);
      return { success: false, error: 'Failed to fetch payouts' };
    }

    return { success: true, payouts: payouts || [] };
  } catch (error) {
    console.error('Error in getPendingPayouts:', error);
    return { success: false, error: 'Internal server error' };
  }
}