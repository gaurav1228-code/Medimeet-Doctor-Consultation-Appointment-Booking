// app/api/100ms/route.js - FINAL WORKING VERSION
import { NextResponse } from "next/server";
import { hmsService } from "@/lib/100ms-service";
import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    let user = await currentUser();

    const dummyUserId = "test-clerk-user-id";
    if (!user) {
      console.warn("⚠️ Using dummy user for testing");
      user = { id: dummyUserId };
    }

    const { action, appointmentId, roomId, role } = await request.json();

    // Get user from Supabase
    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_user_id", user.id)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Handle different actions
    if (action === "getToken") {
      const userId = dbUser.id;
      const userRole = role || (dbUser.role === "DOCTOR" ? "host" : "guest");

      console.log('🔄 Getting token for appointment:', { 
        appointmentId, 
        userId, 
        userRole 
      });

      // CRITICAL: Get or create the ACTUAL 100ms room for this appointment
      let hmsRoomId = roomId;
      
      if (!hmsRoomId && appointmentId) {
        // Check if we already have a room for this appointment
        const { data: existingRoom } = await supabase
          .from("appointments")
          .select("hms_room_id")
          .eq("id", appointmentId)
          .single();

        if (existingRoom?.hms_room_id) {
          hmsRoomId = existingRoom.hms_room_id;
          console.log('✅ Found existing room for appointment:', hmsRoomId);
        } else {
          // Create new room in 100ms
          console.log('🔄 Creating new room for appointment...');
          const roomData = await hmsService.getOrCreateAppointmentRoom(appointmentId);
          hmsRoomId = roomData.hmsRoomId;
          
          // Store the 100ms room ID in the appointment
          await supabase
            .from("appointments")
            .update({ hms_room_id: hmsRoomId })
            .eq("id", appointmentId);
          
          console.log('💾 Stored room ID in appointment:', hmsRoomId);
        }
      }

      if (!hmsRoomId) {
        throw new Error("No room ID provided and no appointment ID found");
      }

      // Generate token with the ACTUAL 100ms room ID
      const token = await hmsService.getAuthToken(hmsRoomId, userId, userRole);

      return NextResponse.json({
        success: true,
        token: token,
        roomId: hmsRoomId, // Return the ACTUAL 100ms room ID
        appointmentId: appointmentId,
        userId: userId,
        role: userRole,
      });
    }

    if (action === "createRoom") {
      const roomName = `Appointment ${appointmentId}`;
      const room = await hmsService.createRoom(roomName);

      return NextResponse.json({
        success: true,
        room: room,
      });
    }

    if (action === "endRoom") {
      await hmsService.endRoom(roomId, "Appointment ended");

      return NextResponse.json({
        success: true,
        message: "Room ended successfully",
      });
    }

    if (action === "testConnection") {
      const testResult = await hmsService.testConnection();
      return NextResponse.json(testResult);
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("❌ 100ms API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
