// app/api/admin/route.js - UPDATED FOR NETLIFY
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Disable static generation for this route
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    console.log('🔄 Admin API fetching:', type);

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
        return NextResponse.json(
          { error: 'Invalid type parameter' }, 
          { status: 400 }
        );
    }

    if (error) {
      console.error(`Error fetching ${type}:`, error);
      return NextResponse.json(
        { error: 'Database error' }, 
        { status: 500 }
      );
    }

    const responseKey = type === 'patients' ? 'patients' : 'doctors';
    
    return NextResponse.json({ 
      [responseKey]: data || [],
      success: true 
    });
    
  } catch (error) {
    console.error('Error in admin API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
