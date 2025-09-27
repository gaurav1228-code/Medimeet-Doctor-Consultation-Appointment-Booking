// app/api/admin/patients/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_user_id', userId)
      .single();

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all patients
    const { data: patients, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'PATIENT')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching patients:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ patients: patients || [] });
  } catch (error) {
    console.error('Error in patients API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
