// app/api/clerk-webhook/route.js
import "server-only";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { PLAN_CREDITS, USER_ROLES, VERIFICATION_STATUS, TRANSACTION_TYPES } from "@/lib/constants";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, svix-id, svix-timestamp, svix-signature",
    },
  });
}

export async function POST(req) {
  try {
    const payload = await req.text();
    const headersList = headers();

    const svix_id = headersList.get("svix-id");
    const svix_timestamp = headersList.get("svix-timestamp");
    const svix_signature = headersList.get("svix-signature");

    console.log("📥 Webhook received");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("❌ Missing required headers");
      return new Response("Missing headers", { status: 400 });
    }

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    const evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });

    console.log("✅ Webhook verified:", evt.type);

    // Handle user creation
    if (evt.type === "user.created") {
      await handleUserCreated(evt.data);
    }

    // Handle user updates
    if (evt.type === "user.updated") {
      await handleUserUpdated(evt.data);
    }

    // Handle subscription events
    if (
      evt.type === "subscription.created" ||
      evt.type === "subscription.updated"
    ) {
      await handleSubscriptionChange(evt.data);
    }

    // Handle subscription cancellation
    if (evt.type === "subscription.deleted") {
      await handleSubscriptionDeleted(evt.data);
    }

    return new Response("Webhook received", { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return new Response("Invalid signature", { 
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

async function handleUserCreated(userData) {
  const { id, email_addresses, first_name, last_name, image_url } = userData;

  const email = email_addresses?.[0]?.email_address || null;
  const name = `${first_name || ""} ${last_name || ""}`.trim() || null;

  console.log("👤 Creating user:", { id, email, name });

  const { error } = await supabase.from("users").insert({
    clerk_user_id: id,
    email,
    name,
    image_url,
    role: USER_ROLES.UNASSIGNED,
    credits: 0,
    verification_status: VERIFICATION_STATUS.PENDING,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("❌ Supabase insert error:", error);
    throw error;
  }

  console.log("✅ User created in Supabase:", email);
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

  console.log("👤 Updating user:", { id, email, name });

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
}

async function handleSubscriptionChange(subscriptionData) {
  const { user_id, plan, status } = subscriptionData;

  console.log("💳 Subscription change:", { user_id, plan, status });

  // Only process active subscriptions
  if (status !== "active") {
    console.log("⏸️ Subscription not active, skipping credit allocation");
    return;
  }

  // Get user from Supabase
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_user_id", user_id)
    .single();

  if (userError || !userData) {
    console.error("❌ User not found:", userError);
    return;
  }

  // Only allocate credits to patients
  if (userData.role !== USER_ROLES.PATIENT) {
    console.log("👨‍⚕️ User is not a patient, skipping credit allocation");
    return;
  }

  // Get credits for plan
  const creditsToAllocate = PLAN_CREDITS[plan] || 0;

  if (creditsToAllocate === 0) {
    console.log("🚫 No credits to allocate for plan:", plan);
    return;
  }

  // Check if already allocated this month
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: existingTransaction } = await supabase
    .from("credit_transactions")
    .select("id")
    .eq("user_id", userData.id)
    .eq("package_id", plan)
    .gte("created_at", `${currentMonth}-01`)
    .limit(1);

  if (existingTransaction && existingTransaction.length > 0) {
    console.log("✅ Credits already allocated this month");
    return;
  }

  // Allocate credits
  const { error: transactionError } = await supabase
    .from("credit_transactions")
    .insert([
      {
        user_id: userData.id,
        amount: creditsToAllocate,
        type: TRANSACTION_TYPES.CREDIT_PURCHASE,
        package_id: plan,
      },
    ]);

  if (transactionError) {
    console.error("❌ Error creating transaction:", transactionError);
    return;
  }

  // Update user credits
  const { error: updateError } = await supabase
    .from("users")
    .update({
      credits: userData.credits + creditsToAllocate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userData.id);

  if (updateError) {
    console.error("❌ Error updating credits:", updateError);
    return;
  }

  console.log(`✅ Allocated ${creditsToAllocate} credits for ${plan} plan`);
}

async function handleSubscriptionDeleted(subscriptionData) {
  const { user_id } = subscriptionData;

  console.log("🗑️ Subscription cancelled for user:", user_id);
}
