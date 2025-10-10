// app/api/100ms/test/route.js
import { NextResponse } from "next/server";
import { hmsService } from "@/lib/100ms-service";

export async function GET() {
  try {
    const testResult = await hmsService.testConnection();
    
    // Test room creation
    const testRoomId = `test-${Date.now()}`;
    const room = await hmsService.getOrCreateRoom(testRoomId, "Test Room");
    
    return NextResponse.json({
      success: true,
      connection: testResult,
      room: {
        id: room.id,
        name: room.name,
        created: true
      },
      message: "✅ 100ms service is working correctly"
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: "❌ 100ms service test failed"
    }, { status: 500 });
  }
}
