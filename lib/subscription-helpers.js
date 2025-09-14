// lib/subscription-helpers.js
import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get user's current subscription status
 */
export async function getUserSubscription() {
  try {
    const { has } = await auth();
    
    // Check which plan the user has
    const hasBasic = has({ plan: "free_user" });
    const hasStandard = has({ plan: "standard" });
    const hasPremium = has({ plan: "premium" });

    let currentPlan = null;
    let planName = 'No Plan';

    if (hasPremium) {
      currentPlan = "premium";
      planName = 'Premium';
    } else if (hasStandard) {
      currentPlan = "standard"; 
      planName = 'Standard';
    } else if (hasBasic) {
      currentPlan = "free_user";
      planName = 'Basic';
    }

    return {
      plan: currentPlan,
      planName,
      hasSubscription: currentPlan !== null
    };
  } catch (error) {
    console.error('Error getting subscription:', error);
    return {
      plan: null,
      planName: 'No Plan',
      hasSubscription: false
    };
  }
}

/**
 * Get user's credit transaction history
 */
export async function getUserCreditHistory(limit = 10) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return [];
    }

    // Get user ID from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !userData) {
      return [];
    }

    // Get transaction history
    const { data: transactions, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching credit history:', error);
      return [];
    }

    return transactions || [];
  } catch (error) {
    console.error('Error in getUserCreditHistory:', error);
    return [];
  }
}

/**
 * Get user's appointment history
 */
export async function getUserAppointments(status = null) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return [];
    }

    // Get user ID from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !userData) {
      return [];
    }

    let query = supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctor_id(name, specialty),
        patient:patient_id(name)
      `);

    // Filter based on user role
    if (userData.role === 'PATIENT') {
      query = query.eq('patient_id', userData.id);
    } else if (userData.role === 'DOCTOR') {
      query = query.eq('doctor_id', userData.id);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: appointments, error } = await query
      .order('start_time', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }

    return appointments || [];
  } catch (error) {
    console.error('Error in getUserAppointments:', error);
    return [];
  }
}

/**
 * Check if user can book appointment (has enough credits)
 */
export async function canBookAppointment() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { canBook: false, reason: 'Not authenticated' };
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('credits, role')
      .eq('clerk_user_id', userId)
      .single();

    if (error || !userData) {
      return { canBook: false, reason: 'User not found' };
    }

    if (userData.role !== 'PATIENT') {
      return { canBook: false, reason: 'Only patients can book appointments' };
    }

    const APPOINTMENT_COST = 2;
    if (userData.credits < APPOINTMENT_COST) {
      return { 
        canBook: false, 
        reason: `Insufficient credits. Need ${APPOINTMENT_COST}, have ${userData.credits}`,
        currentCredits: userData.credits,
        requiredCredits: APPOINTMENT_COST
      };
    }

    return { 
      canBook: true, 
      currentCredits: userData.credits,
      requiredCredits: APPOINTMENT_COST
    };
  } catch (error) {
    console.error('Error checking appointment eligibility:', error);
    return { canBook: false, reason: 'System error' };
  }
}

/**
 * Format credit transaction type for display
 */
export function formatTransactionType(type) {
  const types = {
    'CREDIT_PURCHASE': 'Credit Purchase',
    'APPOINTMENT_DEDUCTION': 'Appointment Booked',
    'APPOINTMENT_EARNING': 'Appointment Completed',
    'ADMIN_ADJUSTMENT': 'Admin Adjustment',
    'SUBSCRIPTION_CREDIT': 'Subscription Credits'
  };
  
  return types[type] || type;
}

/**
 * Format credit amount with sign
 */
export function formatCreditAmount(amount) {
  if (amount > 0) {
    return `+${amount}`;
  }
  return amount.toString();
}
