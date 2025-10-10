// lib/actions/admin.js
'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { PAYOUT_STATUS } from '@/lib/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function approvePayout(formData) {
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
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

      // Use transaction to ensure data consistency
      const { data: payout, error: payoutError } = await supabase.rpc('approve_payout_transaction', {
        payout_id: payoutId,
        admin_user_id: adminUser.id
      });

      if (payoutError) {
        console.error('Error in payout transaction:', payoutError);
        
        // If it's a "already processed" error, return success
        if (payoutError.message.includes('already processed') || payoutError.message.includes('not found')) {
          return { success: true, message: 'Payout was already processed' };
        }
        
        // Retry on database conflicts
        if (payoutError.code === '23505' && retryCount < maxRetries - 1) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 200 * retryCount)); // Exponential backoff
          continue;
        }
        
        return { success: false, error: payoutError.message };
      }

      if (!payout || !payout.success) {
        return { success: false, error: payout?.error || 'Failed to process payout' };
      }

      return { success: true, message: 'Payout approved successfully' };

    } catch (error) {
      console.error('Error in approvePayout:', error);
      
      if (retryCount < maxRetries - 1) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 200 * retryCount));
        continue;
      }
      
      return { success: false, error: 'Internal server error' };
    }
  }
  
  return { success: false, error: 'Max retries exceeded' };
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
