// netlify/functions/api/update-doctor-profile.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  console.log('🔄 Update doctor profile function called');
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userId } = context.clientContext?.user || {};
    
    if (!userId) {
      console.error('❌ No user ID found in context');
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: false, error: "Not authenticated" })
      };
    }

    const { 
      role, 
      specialty, 
      experience, 
      description, 
      aadhaar_number, 
      pan_number, 
      medical_license_number,
      document_urls 
    } = JSON.parse(event.body);

    console.log("🔄 API: Updating doctor profile for user:", userId);

    const { data, error } = await supabase
      .from("users")
      .update({
        role,
        specialty,
        experience: parseInt(experience),
        description,
        aadhaar_number,
        pan_number,
        medical_license_number,
        document_urls,
        verification_status: 'PENDING',
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("❌ API: Supabase error:", error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: false, error: error.message })
      };
    }

    console.log("✅ API: Doctor profile updated successfully");
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true, user: data })
    };
    
  } catch (error) {
    console.error("❌ API: Unexpected error:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};