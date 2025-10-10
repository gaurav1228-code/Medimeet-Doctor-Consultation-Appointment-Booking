// lib/server-actions.js

import { getAuthData } from './auth-utils';
import { createServerClient } from '@/lib/supabase-client';
import { PLAN_CREDITS, APPOINTMENT_CREDIT_COST, USER_ROLES, VERIFICATION_STATUS, TRANSACTION_TYPES } from './constants';
// Import format from date-fns at the top of the file
import { format } from 'date-fns';
/**
 * Get user data from Supabase with server-side auth
 */
export async function getUserData() {
  try {
    const { userId, sessionClaims, has } = await getAuthData();
    
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
      const clerkRole = sessionClaims?.metadata?.role;
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          clerk_user_id: userId,
          email: sessionClaims?.email || '',
          name: sessionClaims?.name || '',
          image_url: sessionClaims?.image_url || '',
          role: clerkRole || USER_ROLES.UNASSIGNED,
          credits: clerkRole === USER_ROLES.PATIENT ? APPOINTMENT_CREDIT_COST : 0,
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
    if (userData.role !== USER_ROLES.PATIENT) {
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
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const { data: recentTransaction } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userData.id) // Use the user's ID from users table
      .eq('package_id', currentPlan)
      .gte('created_at', `${currentMonth}-01`)
      .order('created_at', { ascending: false })
      .limit(1);

    // If already allocated this month, return user data
    if (recentTransaction && recentTransaction.length > 0) {
      return userData;
    }

    // Allocate credits - use the correct user_id
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert([{
        user_id: userData.id, // This should be the ID from users table
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
      .eq('id', userData.id) // Use the correct ID
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
export async function deductCreditsForAppointment(doctorId) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

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
// Add these functions to your existing server-actions.js file

export async function getCurrentUser() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }

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

export async function getDoctorSlots(doctorId, days = 4) {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

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

// Update this function in lib/server-actions.js
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
