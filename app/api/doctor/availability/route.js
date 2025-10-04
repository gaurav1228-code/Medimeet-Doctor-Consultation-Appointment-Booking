// app/api/doctor/availability/route.js
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET - Fetch availability slots
export async function GET() {
  try {
    console.log("🔧 API: Fetching availability...");

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get doctor ID
    const { data: doctorData, error: doctorError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .eq("role", "DOCTOR")
      .single();

    if (doctorError || !doctorData) {
      console.log("❌ Doctor not found");
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    console.log("👨‍⚕️ Doctor ID:", doctorData.id);

    // Get availability for next 7 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const { data: availability, error } = await supabase
      .from("availability")
      .select("*")
      .eq("doctor_id", doctorData.id)
      .gte("date", startDate.toISOString().split('T')[0])
      .lt("date", endDate.toISOString().split('T')[0])
      .order("date", { ascending: true });

    if (error) {
      console.error("❌ Database error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    console.log(`✅ Found ${availability?.length || 0} availability records`);
    return NextResponse.json({
      success: true,
      availability: availability || [],
    });
  } catch (error) {
    console.error("❌ API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Set availability slots
export async function POST(req) {
  try {
    console.log("🔧 API: Setting availability...");

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");

    console.log("📅 Received times:", { startTime, endTime });

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: "Start and end time required" },
        { status: 400 }
      );
    }

    // Get doctor ID
    const { data: doctorData, error: doctorError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .eq("role", "DOCTOR")
      .single();

    if (doctorError || !doctorData) {
      console.log("❌ Doctor not found");
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    console.log("👨‍⚕️ Doctor ID:", doctorData.id);

    // Parse the times as IST (local time)
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    console.log("⏰ Parsed time components:", { startHours, startMinutes, endHours, endMinutes });

    if (startHours > endHours || (startHours === endHours && startMinutes >= endMinutes)) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Create availability for next 3 days (single row per day)
    const availabilityRecords = [];
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];

    for (let i = 0; i < 3; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];

      // Only create future availability
      const currentDateStart = new Date(currentDate);
      currentDateStart.setHours(0, 0, 0, 0);
      
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      
      if (currentDateStart >= todayStart) {
        availabilityRecords.push({
          doctor_id: doctorData.id,
          date: dateString,
          start_time: `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}:00`,
          end_time: `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00`,
          status: "ACTIVE",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    console.log(`📅 Created ${availabilityRecords.length} availability records for the next 3 days`);

    if (availabilityRecords.length === 0) {
      return NextResponse.json(
        { error: "No valid availability to create" },
        { status: 400 }
      );
    }

    // Use upsert to handle existing records (update if exists, insert if not)
    const { data, error: upsertError } = await supabase
      .from("availability")
      .upsert(availabilityRecords, {
        onConflict: 'doctor_id,date',
        ignoreDuplicates: false
      })
      .select();

    if (upsertError) {
      console.error("❌ Upsert error:", upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    console.log("✅ Availability set successfully");
    return NextResponse.json({
      success: true,
      availability: data,
      message: `Set availability for ${availabilityRecords.length} days`,
    });
  } catch (error) {
    console.error("❌ API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
