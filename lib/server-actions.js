// lib/server-actions.js
import 'server-only';
import { auth, supabase } from './server-auth';

// Remove the duplicate supabase definition - it's already imported from server-auth
// const supabase = createClient( ... ) // ← DELETE THIS

// Define credit allocations per plan
const PLAN_CREDITS = {
  free_user: 2,
  standard: 10,
  premium: 24,
};

/**
 * Get user data from Supabase with server-side auth
 */
export async function getUserData() {
  try {
    const { userId, sessionClaims, has } = await auth();
    
    if (!userId) {
      return null;
    }

    // Get user from Supabase
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user data:', error);
      return null;
    }

    // If user doesn't exist in Supabase, create them
    if (!userData) {
      const clerkRole = sessionClaims?.metadata?.role;
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          clerk_user_id: userId,
          email: sessionClaims?.email || '',
          name: sessionClaims?.name || '',
          image_url: sessionClaims?.image_url || '',
          role: clerkRole || 'UNASSIGNED',
          credits: clerkRole === 'PATIENT' ? 2 : 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return null;
      }
      
      return newUser;
    }

    // Check and allocate subscription credits
    const updatedUser = await checkAndAllocateCredits(userData, has);
    
    return updatedUser || userData;
  } catch (error) {
    console.error('Error in getUserData:', error);
    return null;
  }
}

/**
 * Check user subscription and allocate credits
 */
export async function checkAndAllocateCredits(userData, hasFunction) {
  try {
    // Only for patients
    if (userData.role !== 'PATIENT') {
      return userData;
    }

    // Check subscription status
    const hasBasic = hasFunction({ plan: "free_user" });
    const hasStandard = hasFunction({ plan: "standard" });
    const hasPremium = hasFunction({ plan: "premium" });

    let currentPlan = null;
    let creditsToAllocate = 0;

    if (hasPremium) {
      currentPlan = "premium";
      creditsToAllocate = PLAN_CREDITS.premium;
    } else if (hasStandard) {
      currentPlan = "standard";
      creditsToAllocate = PLAN_CREDITS.standard;
    } else if (hasBasic) {
      currentPlan = "free_user";
      creditsToAllocate = PLAN_CREDITS.free_user;
    }

    if (!currentPlan || creditsToAllocate === 0) {
      return userData;
    }

    // Check if credits already allocated this month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    const { data: recentTransaction } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userData.id)
      .eq('package_id', currentPlan)
      .gte('created_at', `${currentMonth}-01`)
      .order('created_at', { ascending: false })
      .limit(1);

    // If already allocated this month, return user data
    if (recentTransaction && recentTransaction.length > 0) {
      return userData;
    }

    // Allocate credits
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert([{
        user_id: userData.id,
        amount: creditsToAllocate,
        type: 'CREDIT_PURCHASE',
        package_id: currentPlan,
      }]);

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return userData;
    }

    // Update user credits
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        credits: userData.credits + creditsToAllocate,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user credits:', updateError);
      return userData;
    }

    return updatedUser;
  } catch (error) {
    console.error('Error allocating credits:', error);
    return userData;
  }
}

/**
 * Update user role (server action)
 */
export async function updateUserRole(role) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Update in Supabase
    const { data, error } = await supabase
      .from('users')
      .update({ 
        role,
        credits: role === 'PATIENT' ? 2 : 0,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating role:', error);
      return { success: false, error: error.message };
    }

    return { success: true, user: data };
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Deduct credits for appointment booking (server action)
 */
export async function deductCreditsForAppointment(doctorId) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const APPOINTMENT_CREDIT_COST = 2;

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !userData) {
      return { success: false, error: 'User not found' };
    }

    // Check sufficient credits
    if (userData.credits < APPOINTMENT_CREDIT_COST) {
      return { success: false, error: 'Insufficient credits' };
    }

    // Get doctor data
    const { data: doctorData, error: doctorError } = await supabase
      .from('users')
      .select('*')
      .eq('id', doctorId)
      .single();

    if (doctorError || !doctorData) {
      return { success: false, error: 'Doctor not found' };
    }

    // Create transactions and update credits
    const { error: patientTransactionError } = await supabase
      .from('credit_transactions')
      .insert([{
        user_id: userData.id,
        amount: -APPOINTMENT_CREDIT_COST,
        type: 'APPOINTMENT_DEDUCTION',
      }]);

    if (patientTransactionError) {
      return { success: false, error: 'Failed to create patient transaction' };
    }

    const { error: doctorTransactionError } = await supabase
      .from('credit_transactions')
      .insert([{
        user_id: doctorData.id,
        amount: APPOINTMENT_CREDIT_COST,
        type: 'APPOINTMENT_EARNING',
      }]);

    if (doctorTransactionError) {
      return { success: false, error: 'Failed to create doctor transaction' };
    }

    // Update patient credits
    const { error: patientUpdateError } = await supabase
      .from('users')
      .update({ 
        credits: userData.credits - APPOINTMENT_CREDIT_COST,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.id);

    if (patientUpdateError) {
      return { success: false, error: 'Failed to update patient credits' };
    }

    // Update doctor credits
    const { error: doctorUpdateError } = await supabase
      .from('users')
      .update({ 
        credits: doctorData.credits + APPOINTMENT_CREDIT_COST,
        updated_at: new Date().toISOString()
      })
      .eq('id', doctorData.id);

    if (doctorUpdateError) {
      return { success: false, error: 'Failed to update doctor credits' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deducting credits:', error);
    return { success: false, error: error.message };
  }
}
