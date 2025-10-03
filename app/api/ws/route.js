import { NextResponse } from 'next/server';
import {
  addSignalingMessage,
  getMessagesForParticipant,
  subscribeSignaling,
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
    const participantId = searchParams.get('participantId');
    const since = searchParams.get('since') || 0;
    const wantsSSE = request.headers.get('accept')?.includes('text/event-stream') || searchParams.get('sse') === '1';

    if (!roomId) {
      return NextResponse.json({ success: false, error: 'roomId is required' }, { status: 400 });
    }

    if (wantsSSE) {
      if (!participantId) {
        return NextResponse.json({ success: false, error: 'participantId required for signaling SSE' }, { status: 400 });
      }
      const stream = new ReadableStream({
        start(controller) {
          // Send any buffered messages since 'since'
          const buffered = getMessagesForParticipant(roomId, participantId, since);
          for (const msg of buffered) {
            toSSE(controller, { event: 'signaling', data: msg });
          }

          const unsubscribe = subscribeSignaling(roomId, participantId, (evt) => {
            toSSE(controller, evt);
          });
          const keepAlive = setInterval(() => {
            controller.enqueue(new TextEncoder().encode(`: keepalive ${Date.now()}\n\n`));
          }, 25000);
          const abortHandler = () => {
            clearInterval(keepAlive);
            unsubscribe();
            try { controller.close(); } catch {}
          };
          request.signal?.addEventListener('abort', abortHandler);
        },
      });
      return new Response(stream, { headers: sseHeaders() });
    }

    // JSON fallback polling
    if (!participantId) {
      return NextResponse.json({ success: false, error: 'participantId is required' }, { status: 400 });
    }
    const messages = getMessagesForParticipant(roomId, participantId, since);
    return NextResponse.json({ success: true, messages, timestamp: Date.now() });
  } catch (error) {
    console.error('GET /api/ws error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { roomId, from, to, type, sdp, candidate } = await request.json();
    if (!roomId || !from || !to || !type) {
      return NextResponse.json({ success: false, error: 'roomId, from, to, type are required' }, { status: 400 });
    }

    const message = { from, to, type, sdp, candidate, timestamp: Date.now() };
    addSignalingMessage(roomId, message);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/ws error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
