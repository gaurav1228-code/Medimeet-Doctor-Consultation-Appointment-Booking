// lib/server-actions.js

// lib/server-actions.js - UPDATED FOR NETLIFY
import { createServerClient } from '@/lib/supabase-client';
import { PLAN_CREDITS, APPOINTMENT_CREDIT_COST, USER_ROLES, VERIFICATION_STATUS, TRANSACTION_TYPES } from './constants';
import { format } from 'date-fns';

// Remove all Clerk auth imports - we'll handle auth at the page level

/**
 * Get user data from Supabase (for server components)
 */
export async function getUserData(userId) {
  try {
    if (!userId) {
      return null;
    }

    const supabase = createServerClient();

    // Get user from Supabase
    const { data: userData, error } = await supabase
      .from('users')
      .select('*, aadhaar_verified, pan_verified, medical_license_verified')
      .eq('clerk_user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user data:', error);
      return null;
    }

    // If user doesn't exist in Supabase, create them
    if (!userData) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          clerk_user_id: userId,
          email: '', // Will be updated via webhook
          name: '', // Will be updated via webhook
          image_url: '', // Will be updated via webhook
          role: USER_ROLES.UNASSIGNED,
          credits: 0,
          verification_status: VERIFICATION_STATUS.PENDING,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (createError) {
        console.log('Error creating user:', createError);
        return null;
      }
      
      return newUser;
    }

    return userData;
  } catch (error) {
    console.error('Error in getUserData:', error);
    return null;
  }
}

/**
 * Server-side function to get admin data
 */
export async function getAdminDataServer() {
  try {
    console.log('🔄 Fetching admin data server-side...');
    
    const supabase = createServerClient();
    
    const [
      pendingDoctorsResult,
      verifiedDoctorsResult, 
      patientsResult
    ] = await Promise.all([
      supabase
        .from('users')
        .select('*')
        .eq('role', 'DOCTOR')
        .eq('verification_status', 'PENDING')
        .order('created_at', { ascending: true }),
      
      supabase
        .from('users')
        .select('*')
        .eq('role', 'DOCTOR')
        .in('verification_status', ['VERIFIED', 'REJECTED'])
        .order('created_at', { ascending: false }),
      
      supabase
        .from('users')
        .select('*')
        .eq('role', 'PATIENT')
        .order('created_at', { ascending: false })
    ]);

    console.log('✅ Admin data fetched successfully');

    return {
      pendingDoctors: pendingDoctorsResult.data || [],
      verifiedDoctors: verifiedDoctorsResult.data || [],
      patients: patientsResult.data || []
    };
  } catch (error) {
    console.error('Error in getAdminDataServer:', error);
    return {
      pendingDoctors: [],
      verifiedDoctors: [],
      patients: []
    };
  }
}

/**
 * Get current user for server components
 */
export async function getCurrentUser(userId) {
  try {
    if (!userId) {
      return null;
    }

    const supabase = createServerClient();

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching current user:', error);
      return null;
    }

    return userData;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

/**
 * Update user role (server action)
 */
export async function updateUserRole(userId, role) {
  try {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = createServerClient();

    // Update in Supabase
    const { data, error } = await supabase
      .from('users')
      .update({ 
        role,
        credits: role === USER_ROLES.PATIENT ? APPOINTMENT_CREDIT_COST : 0,
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
export async function deductCreditsForAppointment(userId, doctorId) {
  try {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = createServerClient();

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
        type: TRANSACTION_TYPES.APPOINTMENT_DEDUCTION,
      }]);

    if (patientTransactionError) {
      return { success: false, error: 'Failed to create patient transaction' };
    }

    const { error: doctorTransactionError } = await supabase
      .from('credit_transactions')
      .insert([{
        user_id: doctorData.id,
        amount: APPOINTMENT_CREDIT_COST,
        type: TRANSACTION_TYPES.APPOINTMENT_EARNING,
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

/**
 * Get doctor slots
 */
export async function getDoctorSlots(doctorId, days = 4) {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const supabase = createServerClient();

    const { data: availability, error } = await supabase
      .from('availability')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('status', 'AVAILABLE')
      .gte('start_time', startDate.toISOString())
      .lt('start_time', endDate.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching doctor slots:', error);
      return [];
    }

    // Group slots by day
    const slotsByDay = {};
    availability?.forEach(slot => {
      const date = new Date(slot.start_time).toISOString().split('T')[0];
      if (!slotsByDay[date]) {
        slotsByDay[date] = [];
      }
      
      slotsByDay[date].push({
        startTime: slot.start_time,
        endTime: slot.end_time,
        formatted: `${format(new Date(slot.start_time), 'h:mm a')} - ${format(new Date(slot.end_time), 'h:mm a')}`,
        availabilityId: slot.id
      });
    });

    // Convert to array format
    const daysArray = Object.keys(slotsByDay).map(date => ({
      date,
      displayDate: format(new Date(date), 'EEEE, MMMM d'),
      slots: slotsByDay[date]
    }));

    return daysArray;
  } catch (error) {
    console.error('Error in getDoctorSlots:', error);
    return [];
  }
}

/**
 * Get doctor availability for patient
 */
export async function getDoctorAvailabilityForPatient(doctorId, days = 4) {
  try {
    console.log('🔄 getDoctorAvailabilityForPatient called for doctor:', doctorId);
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    console.log('📅 Date range:', {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });

    const supabase = createServerClient();

    // Get availability records
    const { data: availability, error: availabilityError } = await supabase
      .from('availability')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('status', 'ACTIVE')
      .gte('date', startDate.toISOString().split('T')[0])
      .lt('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (availabilityError) {
      console.error('❌ Error fetching availability:', availabilityError);
      return [];
    }

    console.log('✅ Availability data:', availability);

    // Get existing appointments for conflict checking
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('start_time, end_time, status')
      .eq('doctor_id', doctorId)
      .in('status', ['SCHEDULED', 'CONFIRMED'])
      .gte('start_time', startDate.toISOString())
      .lt('start_time', endDate.toISOString());

    if (appointmentsError) {
      console.error('❌ Error fetching appointments:', appointmentsError);
    }

    console.log('✅ Appointments data:', appointments);

    // Generate time slots from availability records
    const daysArray = [];

    availability?.forEach(avail => {
      const date = new Date(avail.date);
      const slots = [];
      
      // Parse start and end times (stored as IST time strings)
      const [startHour, startMinute] = avail.start_time.split(':').map(Number);
      const [endHour, endMinute] = avail.end_time.split(':').map(Number);
      
      // Create date objects with the specific time (in local timezone - IST)
      const slotStart = new Date(date);
      slotStart.setHours(startHour, startMinute, 0, 0);
      
      const slotEnd = new Date(date);
      slotEnd.setHours(endHour, endMinute, 0, 0);
      
      // Generate 30-minute slots
      let currentSlot = new Date(slotStart);
      const now = new Date();
      
      while (currentSlot < slotEnd) {
        const nextSlot = new Date(currentSlot.getTime() + 30 * 60 * 1000);
        
        // Don't create slots that would extend beyond end time
        if (nextSlot > slotEnd) break;
        
        // Only create future slots
        if (currentSlot > now) {
          // Check for conflicts with existing appointments
          const hasConflict = appointments?.some(appointment => {
            const appointmentStart = new Date(appointment.start_time);
            const appointmentEnd = new Date(appointment.end_time);
            
            return (
              (currentSlot >= appointmentStart && currentSlot < appointmentEnd) ||
              (nextSlot > appointmentStart && nextSlot <= appointmentEnd) ||
              (currentSlot <= appointmentStart && nextSlot >= appointmentEnd)
            );
          });
          
          if (!hasConflict) {
            slots.push({
              startTime: currentSlot.toISOString(),
              endTime: nextSlot.toISOString(),
              formatted: `${format(currentSlot, 'h:mm a')} - ${format(nextSlot, 'h:mm a')}`,
              availabilityId: avail.id
            });
          }
        }
        
        currentSlot = nextSlot;
      }
      
      if (slots.length > 0) {
        daysArray.push({
          date: avail.date,
          displayDate: format(date, 'EEEE, MMMM d'),
          slots
        });
      }
    });

    console.log('✅ Final days array:', daysArray);
    return daysArray;
  } catch (error) {
    console.error('❌ Error in getDoctorAvailabilityForPatient:', error);
    return [];
  }
}

/**
 * Check and allocate subscription credits
 */
export async function checkAndAllocateCredits(userData, subscriptionData) {
  try {
    // Only for patients
    if (userData.role !== USER_ROLES.PATIENT) {
      return userData;
    }

    const supabase = createServerClient();

    // Determine plan from subscription data
    let currentPlan = null;
    let creditsToAllocate = 0;

    if (subscriptionData.plan === "premium") {
      currentPlan = "premium";
      creditsToAllocate = PLAN_CREDITS.premium;
    } else if (subscriptionData.plan === "standard") {
      currentPlan = "standard";
      creditsToAllocate = PLAN_CREDITS.standard;
    } else if (subscriptionData.plan === "free_user") {
      currentPlan = "free_user";
      creditsToAllocate = PLAN_CREDITS.free_user;
    }

    if (!currentPlan || creditsToAllocate === 0) {
      return userData;
    }

    // Check if credits already allocated this month
    const currentMonth = new Date().toISOString().slice(0, 7);
    
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
        type: TRANSACTION_TYPES.CREDIT_PURCHASE,
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
 * Get user subscription status
 */
export async function getUserSubscription(userId) {
  try {
    if (!userId) {
      return {
        plan: null,
        planName: "No Plan",
        hasSubscription: false,
      };
    }

    // This would typically call your subscription service
    // For now, return a basic structure
    return {
      plan: null,
      planName: "No Plan",
      hasSubscription: false,
    };
  } catch (error) {
    console.error("Error getting subscription:", error);
    return {
      plan: null,
      planName: "No Plan",
      hasSubscription: false,
    };
  }
}

/**
 * Get user's credit transaction history
 */
export async function getUserCreditHistory(userId, limit = 10) {
  try {
    if (!userId) {
      return [];
    }

    const supabase = createServerClient();

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
 * Get user's appointments
 */
export async function getUserAppointments(userId, status = null) {
  try {
    if (!userId) {
      return [];
    }

    const supabase = createServerClient();

    // Get user ID from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !userData) {
      return [];
    }

    let query = supabase.from('appointments').select(`
          *,
          doctor:doctor_id(name, specialty),
          patient:patient_id(name)
        `);

    // Filter based on user role
    if (userData.role === USER_ROLES.PATIENT) {
      query = query.eq('patient_id', userData.id);
    } else if (userData.role === USER_ROLES.DOCTOR) {
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
