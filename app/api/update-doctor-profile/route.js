// app/api/update-doctor-profile/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { VERIFICATION_STATUS } from '@/lib/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { userId } = await auth();
    const { 
      role, 
      specialty, 
      experience, 
      description, 
      aadhaar_number, 
      pan_number, 
      medical_license_number,
      document_urls,
      verification_status 
    } = await req.json();
    
    console.log("🔄 API: Updating doctor profile for user:", userId);
    
    if (!userId) {
      console.log("❌ API: No user ID found");
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    
    const updateData = { 
      role,
      specialty,
      experience,
      description,
      aadhaar_number,
      pan_number,
      medical_license_number,
      document_urls,
      updated_at: new Date().toISOString(),
      verification_status: verification_status || VERIFICATION_STATUS.PENDING
    };

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (error) {
      console.error("❌ API: Supabase error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log("✅ API: Doctor profile updated successfully:", data);
    return NextResponse.json({ success: true, user: data });
    
  } catch (error) {
    console.error("❌ API: Unexpected error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
