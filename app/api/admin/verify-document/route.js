// app/api/admin/verify-document/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
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

    const { doctorId, documentType } = await req.json();

    if (!doctorId || !documentType) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Update document verification status
    const updateData = {
      [`${documentType}_verified`]: true,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', doctorId)
      .select()
      .single();

    if (error) {
      console.error('Error verifying document:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, doctor: data });
  } catch (error) {
    console.error('Error in verify document API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}