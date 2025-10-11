// app/api/admin/route.js - UPDATED FOR VERCEL
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to check admin access
async function checkAdminAccess(userId) {
  if (!userId) {
    return { error: 'Unauthorized', status: 401 };
  }

  const { data: adminUser, error } = await supabase
    .from('users')
    .select('role')
    .eq('clerk_user_id', userId)
    .single();

  if (error || adminUser?.role !== 'ADMIN') {
    return { error: 'Admin access required', status: 403 };
  }

  return { success: true };
}

export async function GET(request) {
  try {
    const { userId } = await auth();
    const adminCheck = await checkAdminAccess(userId);
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    console.log('🔄 Admin API fetching:', type, 'for user:', userId);

    let data, error;

    switch (type) {
      case 'pending-doctors':
        ({ data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'DOCTOR')
          .eq('verification_status', 'PENDING')
          .order('created_at', { ascending: true }));
        break;

      case 'verified-doctors':
        ({ data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'DOCTOR')
          .in('verification_status', ['VERIFIED', 'REJECTED'])
          .order('created_at', { ascending: false }));
        break;

      case 'patients':
        ({ data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'PATIENT')
          .order('created_at', { ascending: false }));
        break;

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    if (error) {
      console.error(`Error fetching ${type}:`, error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const responseKey = type === 'patients' ? 'patients' : 'doctors';
    console.log(`✅ Admin API found ${data?.length || 0} ${responseKey}`);
    
    return NextResponse.json({ [responseKey]: data || [] });
  } catch (error) {
    console.error('Error in admin API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    const adminCheck = await checkAdminAccess(userId);
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const body = await request.json();
    const { action, doctorId, status, documentType, suspend } = body;

    console.log('🔄 Admin POST action:', action, body);

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    let data, error;
    const updateData = { updated_at: new Date().toISOString() };

    switch (action) {
      case 'verify-doctor':
        if (!doctorId || !status) {
          return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }
        updateData.verification_status = status;
        ({ data, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', doctorId)
          .select()
          .single());
        break;

      case 'verify-document':
        if (!doctorId || !documentType) {
          return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }
        updateData[`${documentType}_verified`] = true;
        ({ data, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', doctorId)
          .select()
          .single());
        break;

      case 'update-doctor-status':
        if (!doctorId || typeof suspend !== 'boolean') {
          return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }
        updateData.verification_status = suspend ? "REJECTED" : "VERIFIED";
        ({ data, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', doctorId)
          .select()
          .single());
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (error) {
      console.error(`Error performing ${action}:`, error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, doctor: data });
  } catch (error) {
    console.error('Error in admin POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}