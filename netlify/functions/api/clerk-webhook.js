// netlify/functions/api/clerk-webhook.js
const { Webhook } = require('svix');
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

const VERIFICATION_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
};

const TRANSACTION_TYPES = {
  CREDIT_PURCHASE: 'CREDIT_PURCHASE',
  APPOINTMENT_DEDUCTION: 'APPOINTMENT_DEDUCTION',
  APPOINTMENT_REFUND: 'APPOINTMENT_REFUND',
  APPOINTMENT_EARNING: 'APPOINTMENT_EARNING',
  PAYOUT: 'PAYOUT'
};

exports.handler = async (event, context) => {
  console.log('🔔 Webhook received at:', new Date().toISOString());
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, svix-id, svix-timestamp, svix-signature',
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
    const payload = event.body;
    const headers = event.headers;

    const svix_id = headers['svix-id'];
    const svix_timestamp = headers['svix-timestamp'];
    const svix_signature = headers['svix-signature'];

    console.log("📥 Webhook received - Headers present:", { 
      hasSvixId: !!svix_id, 
      hasSvixTimestamp: !!svix_timestamp, 
      hasSvixSignature: !!svix_signature 
    });

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("❌ Missing required headers");
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing webhook headers' })
      };
    }

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    
    let evt;
    try {
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error("❌ Webhook verification failed:", err.message);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    console.log("✅ Webhook verified:", evt.type);

    // Handle user creation
    if (evt.type === "user.created") {
      await handleUserCreated(evt.data);
    }

    // Handle user updates
    if (evt.type === "user.updated") {
      await handleUserUpdated(evt.data);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true, message: 'Webhook processed successfully' })
    };
  } catch (err) {
    console.error("❌ Webhook processing failed:", err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function handleUserCreated(userData) {
  const { id, email_addresses, first_name, last_name, image_url } = userData;

  const email = email_addresses?.[0]?.email_address || null;
  const name = `${first_name || ""} ${last_name || ""}`.trim() || null;

  console.log("👤 Creating user in Supabase:", { id, email, name });

  try {
    // First check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", id)
      .single();

    if (existingUser) {
      console.log("ℹ️ User already exists in Supabase");
      return;
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        clerk_user_id: id,
        email,
        name,
        image_url,
        role: USER_ROLES.UNASSIGNED,
        credits: 2, // Give 2 free credits initially
        verification_status: VERIFICATION_STATUS.PENDING,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase insert error:", error);
      throw error;
    }

    console.log("✅ User created in Supabase:", email);

    // Create welcome credit transaction
    const { error: transactionError } = await supabase
      .from("credit_transactions")
      .insert([
        {
          user_id: newUser.id,
          amount: 2,
          type: TRANSACTION_TYPES.CREDIT_PURCHASE,
          package_id: "welcome_bonus",
          created_at: new Date().toISOString(),
        },
      ]);

    if (transactionError) {
      console.error("❌ Error creating welcome credit transaction:", transactionError);
    } else {
      console.log("✅ Welcome credits allocated to user:", newUser.id);
    }

  } catch (error) {
    console.error("❌ Error in handleUserCreated:", error);
    throw error;
  }
}

async function handleUserUpdated(userData) {
  const {
    id,
    email_addresses,
    first_name,
    last_name,
    image_url,
    unsafe_metadata,
  } = userData;

  const email = email_addresses?.[0]?.email_address || null;
  const name = `${first_name || ""} ${last_name || ""}`.trim() || null;

  console.log("👤 Updating user in Supabase:", { id, email, name });

  try {
    const updateData = {
      email,
      name,
      image_url,
      updated_at: new Date().toISOString(),
    };

    // Update role if provided in metadata
    if (unsafe_metadata?.role && unsafe_metadata.role !== USER_ROLES.UNASSIGNED) {
      updateData.role = unsafe_metadata.role;
      console.log("🎯 Updating role to:", unsafe_metadata.role);
    }

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("clerk_user_id", id);

    if (error) {
      console.error("❌ Supabase update error:", error);
      throw error;
    }

    console.log("✅ User updated in Supabase");
  } catch (error) {
    console.error("❌ Error in handleUserUpdated:", error);
    throw error;
  }
}