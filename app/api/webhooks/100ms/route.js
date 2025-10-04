// app/api/webhooks/100ms/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const payload = await request.json();
    
    console.log("📨 100ms Webhook Received:", {
      type: payload.type,
      timestamp: new Date().toISOString()
    });

    // Process different event types
    if (payload.type === 'session.started') {
      console.log('🎬 Session started:', payload.data);
    } else if (payload.type === 'peer.joined') {
      console.log('👤 Peer joined:', payload.data);
    } else if (payload.type === 'peer.left') {
      console.log('👤 Peer left:', payload.data);
    }

    return NextResponse.json({ 
      success: true,
      message: "Webhook received successfully"
    });
  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
