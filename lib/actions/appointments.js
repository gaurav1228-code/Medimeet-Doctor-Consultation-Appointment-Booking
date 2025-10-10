// lib/actions/appointments.js - IMPROVED CREDIT HANDLING
'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { APPOINTMENT_CREDIT_COST } from '@/lib/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function bookAppointment(formData) {
  console.log("🚀 Starting bookAppointment function...");

  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const doctorId = formData.get("doctorId");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");
    const description = formData.get("description");

    console.log("📋 Form data:", { doctorId, startTime, endTime, description });

    if (!doctorId || !startTime || !endTime) {
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
      return { success: false, error: "Patient not found" };
    }

    console.log("👤 Patient found:", patientData.id, "Credits:", patientData.credits);

    // Check if patient has enough credits
    if (patientData.credits < APPOINTMENT_CREDIT_COST) {
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
      return { success: false, error: "Time slot not available" };
    }

    // Get doctor data
    const { data: doctorData, error: doctorError } = await supabase
      .from("users")
      .select("id, credits, name")
      .eq("id", doctorId)
      .single();

    if (doctorError || !doctorData) {
      return { success: false, error: "Doctor not found" };
    }

    console.log("👨‍⚕️ Doctor found:", doctorData.id, "Current credits:", doctorData.credits);

    // Start transaction: Create appointment + transfer credits
    console.log("💾 Creating appointment and transferring credits...");

    // Create appointment
    const { data: newAppointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        patient_id: patientData.id,
        doctor_id: doctorId,
        start_time: startTime,
        end_time: endTime,
        status: "SCHEDULED",
        patient_description: description,
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

    // 1. Deduct credits from patient
    console.log("💰 Deducting credits from patient...");
    const { error: patientCreditError } = await supabase
      .from("users")
      .update({
        credits: patientData.credits - APPOINTMENT_CREDIT_COST,
        updated_at: new Date().toISOString(),
      })
      .eq("id", patientData.id);

    if (patientCreditError) {
      console.error("❌ Error deducting patient credits:", patientCreditError);
      // Rollback appointment creation
      await supabase.from("appointments").delete().eq("id", newAppointment.id);
      return { success: false, error: "Failed to deduct credits from patient" };
    }

    // 2. Add credits to doctor INSTANTLY
    console.log("💰 Adding credits to doctor...");
    const { error: doctorCreditError } = await supabase
      .from("users")
      .update({
        credits: doctorData.credits + APPOINTMENT_CREDIT_COST,
        updated_at: new Date().toISOString(),
      })
      .eq("id", doctorId);

    if (doctorCreditError) {
      console.error("❌ Error adding doctor credits:", doctorCreditError);
      // Rollback everything
      await supabase.from("appointments").delete().eq("id", newAppointment.id);
      await supabase.from("users").update({
        credits: patientData.credits,
        updated_at: new Date().toISOString(),
      }).eq("id", patientData.id);
      return { success: false, error: "Failed to add credits to doctor" };
    }

    // 3. Create credit transaction records
    console.log("📝 Creating credit transactions...");
    
    // Patient transaction (deduction)
    const { error: patientTransactionError } = await supabase.from("credit_transactions").insert({
      user_id: patientData.id,
      amount: -APPOINTMENT_CREDIT_COST,
      type: "APPOINTMENT_BOOKING",
      appointment_id: newAppointment.id,
      created_at: new Date().toISOString(),
    });

    if (patientTransactionError) {
      console.error("❌ Error creating patient transaction:", patientTransactionError);
    }

    // Doctor transaction (earning)
    const { error: doctorTransactionError } = await supabase.from("credit_transactions").insert({
      user_id: doctorId,
      amount: APPOINTMENT_CREDIT_COST,
      type: "APPOINTMENT_EARNING",
      appointment_id: newAppointment.id,
      created_at: new Date().toISOString(),
    });

    if (doctorTransactionError) {
      console.error("❌ Error creating doctor transaction:", doctorTransactionError);
    }

    // Verify the credit transfer worked
    const { data: updatedPatient } = await supabase
      .from("users")
      .select("credits")
      .eq("id", patientData.id)
      .single();

    const { data: updatedDoctor } = await supabase
      .from("users")
      .select("credits")
      .eq("id", doctorId)
      .single();

    console.log("🔍 Credit transfer verification:");
    console.log("Patient credits:", updatedPatient?.credits);
    console.log("Doctor credits:", updatedDoctor?.credits);

    console.log("🎉 Appointment booking completed successfully!");
    return {
      success: true,
      appointment: newAppointment,
      message: "Appointment booked successfully! Credits transferred to doctor.",
    };
  } catch (error) {
    console.error("❌ Error in bookAppointment:", error);
    return { success: false, error: "Internal server error: " + error.message };
  }
}
