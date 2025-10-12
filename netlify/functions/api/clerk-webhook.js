// functions/api/clerk-webhook.js
const { Webhook } = require('svix');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  console.log('🔔 Clerk webhook function called');
  
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

    console.log("📥 Webhook received");

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
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
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
          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ success: true, message: 'User already exists' })
          };
        }

        // Create new user
        const { data: newUser, error } = await supabase
          .from("users")
          .insert({
            clerk_user_id: id,
            email,
            name,
            image_url,
            role: 'UNASSIGNED',
            credits: 2,
            verification_status: 'PENDING',
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
              type: 'CREDIT_PURCHASE',
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
        console.error("❌ Error in user creation:", error);
        throw error;
      }
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