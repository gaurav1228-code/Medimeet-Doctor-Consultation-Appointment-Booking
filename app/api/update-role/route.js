// app/api/update-role/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { userId } = await auth();
    const { role } = await req.json();
    
    console.log("🔄 API: Updating role for user:", userId, "to:", role);
    
    if (!userId) {
      console.log("❌ API: No user ID found");
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    
    // Update in Supabase
    const { data, error } = await supabase
      .from('users')
      .update({ 
        role,
        credits: role === 'PATIENT' ? 2 : 0,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (error) {
      console.error("❌ API: Supabase error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log("✅ API: Role updated successfully:", data);
    return NextResponse.json({ success: true, user: data });
    
  } catch (error) {
    console.error("❌ API: Unexpected error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}