// app/api/clerk-webhook/route.js
import { Webhook } from "svix";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    console.log("Event data:", evt.data);

    if (evt.type === "user.created") {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      
      const email = email_addresses?.[0]?.email_address || null;
      const name = `${first_name || ""} ${last_name || ""}`.trim() || null;

      console.log("👤 Creating user:", { id, email, name });

      // Insert with UNASSIGNED role - user will select role later
      const { data, error } = await supabase.from("users").insert({
        clerk_user_id: id,
        email,
        name,
        image_url,
        role: "UNASSIGNED",
        credits: 2,
        verification_status: "PENDING",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("❌ Supabase insert error:", error);
        return new Response("Database error", { status: 500 });
      } else {
        console.log("✅ User inserted into Supabase:", email);
        console.log("Inserted data:", data);
      }
    }

    if (evt.type === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url, unsafe_metadata } = evt.data;
      
      const email = email_addresses?.[0]?.email_address || null;
      const name = `${first_name || ""} ${last_name || ""}`.trim() || null;

      console.log("👤 Updating user:", { id, email, name });
      console.log("Unsafe metadata:", unsafe_metadata);

      // Prepare update data
      const updateData = {
        email,
        name,
        image_url,
        updated_at: new Date().toISOString(),
      };

      // If role is in unsafe metadata, update it
      if (unsafe_metadata?.role && unsafe_metadata.role !== "UNASSIGNED") {
        updateData.role = unsafe_metadata.role;
        console.log("Updating role to:", unsafe_metadata.role);
      }

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("clerk_user_id", id)
        .select();

      if (error) {
        console.error("❌ Supabase update error:", error);
        return new Response("Database error", { status: 500 });
      } else {
        console.log("✅ User updated in Supabase:", email);
        console.log("Updated data:", data);
      }
    }

    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }
}