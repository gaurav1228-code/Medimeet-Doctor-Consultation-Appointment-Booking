// lib/admin-data.js
import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getPendingDoctors() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_user_id', userId)
      .single();

    if (adminUser?.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }

    // Get pending doctors
    const { data: doctors, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'DOCTOR')
      .eq('verification_status', 'PENDING')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending doctors:', error);
      throw new Error('Database error');
    }

    return doctors || [];
  } catch (error) {
    console.error('Error in getPendingDoctors:', error);
    return [];
  }
}

export async function getVerifiedDoctors() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_user_id', userId)
      .single();

    if (adminUser?.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }

    // Get verified doctors
    const { data: doctors, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'DOCTOR')
      .in('verification_status', ['VERIFIED', 'REJECTED'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching verified doctors:', error);
      throw new Error('Database error');
    }

    return doctors || [];
  } catch (error) {
    console.error('Error in getVerifiedDoctors:', error);
    return [];
  }
}