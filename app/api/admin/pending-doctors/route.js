// app/api/admin/pending-doctors/route.js
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

    // Get pending doctors
    const { data: doctors, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'DOCTOR')
      .eq('verification_status', 'PENDING')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending doctors:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ doctors: doctors || [] });
  } catch (error) {
    console.error('Error in pending doctors API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
