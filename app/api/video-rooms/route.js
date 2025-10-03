import { NextResponse } from 'next/server';
import {
  addParticipant,
  removeParticipant,
  heartbeatParticipant,
  cleanupPresenceRoom,
  getParticipants,
  subscribePresence,
} from '@/lib/realtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  };
}

function toSSE(controller, { event, data }) {
  const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(payload));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const wantsSSE = request.headers.get('accept')?.includes('text/event-stream') || searchParams.get('sse') === '1';

    if (!roomId) {
      return NextResponse.json({ success: false, error: 'roomId is required' }, { status: 400 });
    }

    // SSE stream of presence updates
    if (wantsSSE) {
      const stream = new ReadableStream({
        start(controller) {
          // Initial snapshot
          toSSE(controller, {
            event: 'participants_updated',
            data: { participants: getParticipants(roomId), count: getParticipants(roomId).length, timestamp: Date.now() },
          });

          const unsubscribe = subscribePresence(roomId, (evt) => {
            toSSE(controller, evt);
          });

          const keepAlive = setInterval(() => {
            controller.enqueue(new TextEncoder().encode(`: keepalive ${Date.now()}\n\n`));
            cleanupPresenceRoom(roomId);
          }, 25000);

          const abortHandler = () => {
            clearInterval(keepAlive);
            unsubscribe();
            try { controller.close(); } catch {}
          };
          request.signal?.addEventListener('abort', abortHandler);
        },
        cancel() {},
      });

      return new Response(stream, { headers: sseHeaders() });
    }

    // JSON snapshot
    const participants = getParticipants(roomId);
    return NextResponse.json({ success: true, participants, count: participants.length, timestamp: Date.now() });
  } catch (error) {
    console.error('GET /api/video-rooms error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { roomId, action, participantId } = await request.json();
    if (!roomId || !action || !participantId) {
      return NextResponse.json({ success: false, error: 'roomId, action, participantId are required' }, { status: 400 });
    }

    const now = Date.now();
    if (action === 'join') {
      addParticipant(roomId, participantId, now);
    } else if (action === 'leave') {
      removeParticipant(roomId, participantId);
    } else if (action === 'heartbeat') {
      heartbeatParticipant(roomId, participantId, now);
    }

    const participants = getParticipants(roomId);
    return NextResponse.json({ success: true, participants, count: participants.length, timestamp: now });
  } catch (error) {
    console.error('POST /api/video-rooms error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
