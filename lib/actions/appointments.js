// lib/actions/appointments.js - FIXED
"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { APPOINTMENT_CREDIT_COST } from "@/lib/constants";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function bookAppointment(formData) {
  console.log("🚀 Starting bookAppointment function...");

  try {
    const { userId } = await auth();

    if (!userId) {
      console.log("❌ No user ID found");
      return { success: false, error: "Not authenticated" };
    }

    const doctorId = formData.get("doctorId");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");
    const description = formData.get("description");

    console.log("📋 Form data:", { doctorId, startTime, endTime, description });

    if (!doctorId || !startTime || !endTime) {
      console.log("❌ Missing required fields");
      return { success: false, error: "Missing required fields" };
    }

    // Get patient data
    const { data: patientData, error: patientError } = await supabase
      .from("users")
      .select("id, credits, name")
      .eq("clerk_user_id", userId)
      .eq("role", "PATIENT")
      .single();

    if (patientError || !patientData) {
      console.log("❌ Patient not found:", patientError);
      return { success: false, error: "Patient not found" };
    }

    console.log("👤 Patient found:", patientData.id);

    // Check if patient has enough credits
    if (patientData.credits < APPOINTMENT_CREDIT_COST) {
      console.log("❌ Insufficient credits");
      return { success: false, error: "Insufficient credits" };
    }

    // Check for conflicting appointments
    const { data: conflictingAppointment } = await supabase
      .from("appointments")
      .select("id")
      .or(`patient_id.eq.${patientData.id},doctor_id.eq.${doctorId}`)
      .eq("start_time", startTime)
      .in("status", ["SCHEDULED", "CONFIRMED"])
      .single();

    if (conflictingAppointment) {
      console.log("❌ Conflicting appointment found");
      return { success: false, error: "Time slot not available" };
    }

    // Create video session using 100ms
    let videoSessionId = null;
    let videoSessionToken = null;
    let videoRoomUrl = null;

    try {
      console.log("🎥 Creating 100ms video session...");

      const roomName = `appointment-${newAppointment.id}`;
      const roomData = await hmsVideoService.createRoom(roomName);

      videoSessionId = roomData.roomId;
      videoRoomUrl = hmsVideoService.getRoomJoinUrl(videoSessionId);

      // Generate initial token for patient
      videoSessionToken = await hmsVideoService.generateAuthToken(
        videoSessionId,
        patientData.id,
        "guest"
      );

      console.log("✅ 100ms video session created:", videoSessionId);
    } catch (videoError) {
      console.error("❌ Error creating 100ms session:", videoError);
      // Don't fail the appointment if video fails
      console.log("⚠️ Appointment will be created without video session");
    }

    // Create appointment with video session data
    console.log("💾 Creating appointment in database...");
    const { data: newAppointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        patient_id: patientData.id,
        doctor_id: doctorId,
        start_time: startTime,
        end_time: endTime,
        status: "SCHEDULED",
        patient_description: description,
        video_session_id: videoSessionId,
        video_session_token: videoSessionToken,
        credits_deducted: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (appointmentError) {
      console.error("❌ Error creating appointment:", appointmentError);
      return {
        success: false,
        error: "Failed to book appointment: " + appointmentError.message,
      };
    }

    console.log("✅ Appointment created:", newAppointment.id);

    // Deduct credits from patient
    console.log("💰 Deducting credits...");
    const { error: creditError } = await supabase
      .from("users")
      .update({
        credits: patientData.credits - APPOINTMENT_CREDIT_COST,
        updated_at: new Date().toISOString(),
      })
      .eq("id", patientData.id);

    if (creditError) {
      console.error("❌ Error deducting credits:", creditError);
    }

    // Create credit transaction record
    await supabase.from("credit_transactions").insert({
      user_id: patientData.id,
      amount: -APPOINTMENT_CREDIT_COST,
      type: "APPOINTMENT_DEDUCTION",
      appointment_id: newAppointment.id,
      created_at: new Date().toISOString(),
    });

    console.log("🎉 Appointment booking completed successfully!");
    return {
      success: true,
      appointment: newAppointment,
      message: "Appointment booked successfully!",
    };
  } catch (error) {
    console.error("❌ Error in bookAppointment:", error);
    return { success: false, error: "Internal server error: " + error.message };
  }
}
