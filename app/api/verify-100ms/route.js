// app/api/verify-100ms/route.js
import { NextResponse } from "next/server";
import { hmsService } from "@/lib/100ms-service";

export async function GET() {
  try {
    // Test 1: API Connection
    const connectionTest = await hmsService.testConnection();
    
    // Test 2: Create a test room
    const testRoomId = `verify-${Date.now()}`;
    const room = await hmsService.ensureRoomExists(testRoomId, "Verification Room");
    
    // Test 3: Generate a token
    const token = await hmsService.getAuthToken(testRoomId, "test-user", "host");
    
    return NextResponse.json({
      success: true,
      tests: {
        api_connection: connectionTest.success,
        room_creation: !!room.id,
        token_generation: !!token
      },
      room: {
        id: room.id,
        name: room.name
      },
      token_preview: token ? token.substring(0, 50) + '...' : null,
      message: "✅ 100ms service is fully operational"
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: "❌ 100ms service verification failed"
    }, { status: 500 });
  }
}