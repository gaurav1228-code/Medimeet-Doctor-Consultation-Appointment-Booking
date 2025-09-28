import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { doctorId, startTime, endTime } = await req.json();
    
    console.log('🧪 Test endpoint called:', { doctorId, startTime, endTime });

    // Test insert
    const { data, error } = await supabase
      .from('availability')
      .insert({
        doctor_id: doctorId || 'test-doctor-id',
        start_time: startTime || new Date().toISOString(),
        end_time: endTime || new Date(Date.now() + 3600000).toISOString(), // +1 hour
        status: 'AVAILABLE'
      })
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Test insert successful:', data);
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Test query
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .limit(5);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}