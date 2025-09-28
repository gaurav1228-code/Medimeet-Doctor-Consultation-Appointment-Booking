// app/api/doctor/availability/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Fetch availability slots
export async function GET() {
  try {
    console.log('🔧 API: Fetching availability...');
    
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get doctor ID
    const { data: doctorData, error: doctorError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('role', 'DOCTOR')
      .single();

    if (doctorError || !doctorData) {
      console.log('❌ Doctor not found');
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    console.log('👨‍⚕️ Doctor ID:', doctorData.id);

    // Get availability slots for next 7 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const { data: availability, error } = await supabase
      .from('availability')
      .select('*')
      .eq('doctor_id', doctorData.id)
      .gte('start_time', startDate.toISOString())
      .lt('start_time', endDate.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    console.log(`✅ Found ${availability?.length || 0} slots`);
    return NextResponse.json({ 
      success: true, 
      slots: availability || [] 
    });

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Set availability slots
export async function POST(req) {
  try {
    console.log('🔧 API: Setting availability...');
    
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const startTime = formData.get('startTime');
    const endTime = formData.get('endTime');

    console.log('📅 Received times:', { startTime, endTime });

    if (!startTime || !endTime) {
      return NextResponse.json({ error: 'Start and end time required' }, { status: 400 });
    }

    // Get doctor ID
    const { data: doctorData, error: doctorError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('role', 'DOCTOR')
      .single();

    if (doctorError || !doctorData) {
      console.log('❌ Doctor not found');
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    console.log('👨‍⚕️ Doctor ID:', doctorData.id);

    // Parse the times
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (startDate >= endDate) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // Extract time components
    const startHours = startDate.getUTCHours();
    const startMinutes = startDate.getUTCMinutes();
    const endHours = endDate.getUTCHours();
    const endMinutes = endDate.getUTCMinutes();

    console.log('⏰ Time components:', { startHours, startMinutes, endHours, endMinutes });

    // Create slots for next 3 days (simplified for testing)
    const slots = [];
    const today = new Date();
    
    for (let i = 0; i < 3; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() + i);
      
      // Set to UTC to avoid timezone issues
      const slotStart = new Date(Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate(),
        startHours,
        startMinutes,
        0
      ));

      const slotEnd = new Date(Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate(),
        endHours,
        endMinutes,
        0
      ));

      // Only create future slots
      if (slotStart > new Date()) {
        slots.push({
          doctor_id: doctorData.id,
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
          status: 'AVAILABLE'
          // created_at and updated_at will be set automatically by the database
        });
      }
    }

    console.log(`📅 Created ${slots.length} slots`);

    if (slots.length === 0) {
      return NextResponse.json({ error: 'No valid time slots to create' }, { status: 400 });
    }

    // Delete existing future slots for this doctor
    const { error: deleteError } = await supabase
      .from('availability')
      .delete()
      .eq('doctor_id', doctorData.id)
      .gte('start_time', new Date().toISOString());

    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
      // Continue anyway
    }

    // Insert new slots
    const { data, error: insertError } = await supabase
      .from('availability')
      .insert(slots)
      .select();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    console.log('✅ Slots created successfully');
    return NextResponse.json({ 
      success: true, 
      slots: data, 
      slotsCount: slots.length 
    });

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}