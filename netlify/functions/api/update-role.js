// netlify/functions/api/update-role.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ROLES = {
  PATIENT: 'PATIENT',
  DOCTOR: 'DOCTOR',
  ADMIN: 'ADMIN',
  UNASSIGNED: 'UNASSIGNED'
};

const APPOINTMENT_CREDIT_COST = 2;

exports.handler = async (event, context) => {
  // Handle CORS
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
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: false, error: "Not authenticated" })
      };
    }

    const { role } = JSON.parse(event.body);
    console.log("🔄 API: Updating role for user:", userId, "to:", role);

    // Only give credits to PATIENTS, not DOCTORS
    const credits = role === USER_ROLES.PATIENT ? APPOINTMENT_CREDIT_COST : 0;

    const { data, error } = await supabase
      .from("users")
      .update({
        role,
        credits,
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

    console.log("✅ API: Role updated successfully:", data);
    
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