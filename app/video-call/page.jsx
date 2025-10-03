"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Loader2, Video, VideoOff, Mic, MicOff, PhoneOff, Copy } from 'lucide-react';

export default function VideoCallPage() {
  const searchParams = useSearchParams();

  const [roomId, setRoomId] = useState('');
  const [myId, setMyId] = useState('');
  const [otherParticipantId, setOtherParticipantId] = useState('');

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const presenceESRef = useRef(null);
  const signalingESRef = useRef(null);
  const isInitiatorRef = useRef(false);
  const offerSentRef = useRef(false);
  const joinedRef = useRef(false);

  // WebRTC config
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Initialize IDs and room
  useEffect(() => {
    const rid = searchParams.get('roomId');
    const appointmentId = searchParams.get('appointmentId');
    const finalRoom = rid || (appointmentId ? `appointment-${appointmentId}` : `room-${Math.random().toString(36).slice(2)}`);
    setRoomId(finalRoom);

    const participantId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setMyId(participantId);
  }, [searchParams]);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection(rtcConfig);

    // Add existing local tracks
    if (localStream) {
      for (const track of localStream.getTracks()) {
        pc.addTrack(track, localStream);
      }
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStream(stream);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
        setIsConnected(true);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && otherParticipantId) {
        sendSignal({ type: 'ice-candidate', candidate: event.candidate, to: otherParticipantId });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') setIsConnected(true);
      if (state === 'failed' || state === 'disconnected' || state === 'closed') setIsConnected(false);
    };

    pcRef.current = pc;
    return pc;
  }, [localStream, otherParticipantId]);

  async function sendSignal(message) {
    try {
      await fetch('/api/ws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, from: myId, ...message }),
      });
    } catch (e) {
      // ignore
    }
  }

  async function handleSignalMessage(message) {
    const pc = createPeerConnection();
    try {
      if (message.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal({ type: 'answer', sdp: answer, to: message.from });
      } else if (message.type === 'answer') {
        if (!pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
        }
      } else if (message.type === 'ice-candidate') {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        } catch (_) {}
      }
    } catch (_) {}
  }

  async function createAndSendOffer() {
    const pc = createPeerConnection();
    if (!otherParticipantId || offerSentRef.current) return;
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      await sendSignal({ type: 'offer', sdp: offer, to: otherParticipantId });
      offerSentRef.current = true;
    } catch (_) {}
  }

  async function joinRoom() {
    if (joinedRef.current) return;
    joinedRef.current = true;
    await fetch('/api/video-rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, action: 'join', participantId: myId }),
    });
  }

  function leaveRoom() {
    fetch('/api/video-rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, action: 'leave', participantId: myId }),
    }).catch(() => {});
  }

  function startPresenceSSE() {
    if (presenceESRef.current) return;
    const es = new EventSource(`/api/video-rooms?roomId=${encodeURIComponent(roomId)}&sse=1`);
    es.addEventListener('participants_updated', (evt) => {
      try {
        const payload = JSON.parse(evt.data);
        setParticipantCount(payload.count || 0);
        const others = (payload.participants || []).filter((p) => p !== myId);
        if (others[0]) {
          setOtherParticipantId(others[0]);
          isInitiatorRef.current = myId < others[0];
          // Create PC when we discover peer
          const pc = createPeerConnection();
          // Add local tracks if not already added
          if (localStream) {
            const senders = pc.getSenders();
            for (const track of localStream.getTracks()) {
              const already = senders.find((s) => s.track && s.track.kind === track.kind);
              if (!already) pc.addTrack(track, localStream);
            }
          }
          if (payload.count >= 2 && isInitiatorRef.current) {
            // small delay to ensure tracks are attached
            setTimeout(createAndSendOffer, 300);
          }
        } else {
          setOtherParticipantId('');
          setIsConnected(false);
          offerSentRef.current = false;
        }
      } catch (_) {}
    });
    presenceESRef.current = es;
  }

  function startSignalingSSE() {
    if (signalingESRef.current) return;
    const es = new EventSource(`/api/ws?roomId=${encodeURIComponent(roomId)}&participantId=${encodeURIComponent(myId)}&sse=1`);
    es.addEventListener('signaling', (evt) => {
      try {
        const message = JSON.parse(evt.data);
        handleSignalMessage(message);
      } catch (_) {}
    });
    signalingESRef.current = es;
  }

  async function init() {
    setIsLoading(true);
    // Get media first
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    setLocalStream(stream);
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    await joinRoom();
    startPresenceSSE();
    startSignalingSSE();

    // Heartbeat every 15s
    const hb = setInterval(() => {
      fetch('/api/video-rooms', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, action: 'heartbeat', participantId: myId }),
      }).catch(() => {});
    }, 15000);
    heartbeatRef.current = hb;

    setIsLoading(false);
  }

  const heartbeatRef = useRef(null);

  useEffect(() => {
    if (roomId && myId) {
      init().catch(() => setIsLoading(false));
    }
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, myId]);

  function cleanup() {
    // Stop media
    if (localStream) {
      for (const t of localStream.getTracks()) t.stop();
    }
    // Close PC
    if (pcRef.current) {
      try { pcRef.current.close(); } catch {}
      pcRef.current = null;
    }
    // Close SSE
    if (presenceESRef.current) { presenceESRef.current.close(); presenceESRef.current = null; }
    if (signalingESRef.current) { signalingESRef.current.close(); signalingESRef.current = null; }
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }

    leaveRoom();
    setRemoteStream(null);
    setIsConnected(false);
    setOtherParticipantId('');
  }

  const toggleVideo = () => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoEnabled(track.enabled);
    }
  };

  const toggleAudio = () => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsAudioEnabled(track.enabled);
    }
  };

  const endCall = () => {
    cleanup();
    setTimeout(() => {
      if (window && window.close) window.close();
    }, 300);
  };

  const copyRoomId = () => {
    if (!roomId) return;
    navigator.clipboard?.writeText(roomId).catch(() => {});
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-700">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white mb-2">Starting Video Call...</h3>
            <p className="text-gray-400 mb-4 font-mono text-sm">{roomId}</p>
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-300">Share this Room ID:</p>
              <div className="flex items-center justify-between bg-black p-3 rounded border border-gray-600">
                <code className="text-emerald-400 text-sm flex-1 text-left truncate mr-2 font-mono">{roomId}</code>
                <Button onClick={copyRoomId} size="sm" variant="outline" className="border-gray-600">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="w-full max-w-6xl mx-auto bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-white font-semibold text-lg">Video Consultation</h2>
              <p className="text-gray-400 text-sm font-mono">Room: {roomId}</p>
            </div>
            <div className={`text-sm font-medium ${isConnected ? 'text-green-400' : participantCount === 1 ? 'text-yellow-400' : 'text-gray-400'}`}>
              <Users className="h-4 w-4 inline mr-1" /> {participantCount}/2 {isConnected && '• Live'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
          <div className="bg-black rounded-lg overflow-hidden aspect-video relative border-2 border-gray-600">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <VideoOff className="h-12 w-12 text-gray-500" />
                <span className="text-gray-400 ml-2">Camera off</span>
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg overflow-hidden aspect-video relative border-2 border-gray-600 flex items-center justify-center">
            {isConnected && remoteStream ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-gray-400 p-6 max-w-sm">
                <div className="w-16 h-16 border-2 border-dashed border-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <p className="text-lg font-semibold mb-2">{participantCount > 1 ? 'Establishing Connection...' : 'Waiting for Participant'}</p>
                <p className="text-sm mb-1">{participantCount === 1 ? 'You are in the room' : participantCount > 1 ? 'Peer detected - negotiating...' : 'Room is empty'}</p>
                <p className="text-xs text-gray-500 mb-4">Current: {participantCount} of 2 participants</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 p-4 border-t border-gray-700">
          <div className="flex flex-col items-center space-y-3">
            <div className="flex gap-4">
              <Button onClick={toggleVideo} variant={isVideoEnabled ? 'default' : 'destructive'} size="lg" className={`px-6 py-2 h-auto ${isVideoEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>

              <Button onClick={toggleAudio} variant={isAudioEnabled ? 'default' : 'destructive'} size="lg" className={`px-6 py-2 h-auto ${isAudioEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>

              <Button onClick={endCall} variant="destructive" size="lg" className="bg-red-600 hover:bg-red-700 px-8 py-2 h-auto text-base font-semibold min-w-[140px]">
                <PhoneOff className="h-5 w-5 mr-2" /> End Call
              </Button>
            </div>

            <div className="text-center text-sm space-y-1">
              <p className={isConnected ? 'text-green-400 font-medium' : participantCount > 1 ? 'text-blue-400 font-medium' : 'text-yellow-400 font-medium'}>
                {isConnected ? '✅ CONNECTED - Call is live' : participantCount > 1 ? '🔄 NEGOTIATING - Establishing connection...' : '⏳ WAITING FOR PARTICIPANT'}
              </p>
              <p className="text-gray-400">Participants in room: <span className="font-semibold">{participantCount}/2</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
