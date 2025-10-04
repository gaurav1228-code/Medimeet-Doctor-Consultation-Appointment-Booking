// app/video-call/hms-page/page.jsx - FINAL WORKING VERSION
"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  PhoneOff,
  Users,
  Loader2,
  Copy,
  Video,
  VideoOff,
  Mic,
  MicOff,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  selectIsConnectedToRoom,
  selectPeers,
  selectLocalPeer,
  useHMSStore,
  useHMSActions,
  selectIsLocalVideoEnabled,
  selectIsLocalAudioEnabled,
} from "@100mslive/react-sdk";
import { createBrowserClient } from "@/lib/supabase-client";
import { useUser } from "@clerk/nextjs";

export default function HMSVideoCallPage() {
  const searchParams = useSearchParams();
  const { user: clerkUser } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [userData, setUserData] = useState(null);

  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  const localPeer = useHMSStore(selectLocalPeer);
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);

  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Fetch user data from Supabase
  const fetchUserData = async () => {
    if (!clerkUser) return null;
    
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_user_id", clerkUser.id)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        return null;
      }

      setUserData(data);
      return data;
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      return null;
    }
  };

  // Initialize room
  useEffect(() => {
    if (!isMounted || !clerkUser) return;

    const initializeRoom = async () => {
      // First fetch user data
      const userData = await fetchUserData();
      
      const appointmentId = searchParams.get("appointmentId");
      const roomParam = searchParams.get("roomId");

      console.log("🎯 Initializing video call:", { appointmentId, roomParam });
      fetchTokenAndJoin(appointmentId, roomParam, userData);
    };

    initializeRoom();

    // Cleanup on unmount
    return () => {
      if (isConnected) {
        hmsActions.leave().catch(console.error);
      }
    };
  }, [isMounted, clerkUser]);

  // Fetch token and join room
  const fetchTokenAndJoin = async (appointmentId, roomParam, userData) => {
    try {
      setIsLoading(true);
      setError(null);
      setConnectionStatus("connecting");

      console.log("📡 Fetching token for appointment:", appointmentId);

      const response = await fetch("/api/100ms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getToken",
          appointmentId: appointmentId,
          roomId: roomParam
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to get token");
      }

      console.log("✅ Got token, joining room...", data.roomId);
      setConnectionStatus("joining");
      setRoomId(data.roomId); // Set the ACTUAL 100ms room ID

      // Generate username based on user data
      let userName = `User_${data.userId}`;
      if (userData) {
        const prefix = userData.role === 'DOCTOR' ? 'Dr. ' : '';
        const name = userData.name || clerkUser?.fullName || `User_${data.userId}`;
        userName = `${prefix}${name}`;
      } else {
        userName = clerkUser?.fullName || `User_${data.userId}`;
      }

      // Join the room with proper config
      await hmsActions.join({
        authToken: data.token,
        userName: userName,
        settings: {
          isAudioMuted: false,
          isVideoMuted: false,
        },
        rememberDeviceSelection: true,
        captureNetworkQualityInPreview: true,
      });

      console.log("✅ Successfully joined room");
      setConnectionStatus("connected");
      toast.success("Connected to video call!");
      setIsLoading(false);
    } catch (err) {
      console.error("❌ Error joining room:", err);
      setError(err.message);
      setConnectionStatus("error");
      setIsLoading(false);
      toast.error("Failed to join: " + err.message);
    }
  };

  // Attach local video track
  useEffect(() => {
    if (localPeer?.videoTrack && localVideoRef.current) {
      console.log("📹 Attaching local video track");
      hmsActions.attachVideo(localPeer.videoTrack, localVideoRef.current);
    }
  }, [localPeer?.videoTrack, hmsActions]);

  // Attach remote video tracks
  useEffect(() => {
    peers.forEach((peer) => {
      if (peer.id !== localPeer?.id && peer.videoTrack) {
        const videoElement = remoteVideosRef.current[peer.id];
        if (videoElement) {
          console.log("📹 Attaching remote video for peer:", peer.name);
          hmsActions.attachVideo(peer.videoTrack, videoElement);
        }
      }
    });
  }, [peers, localPeer?.id, hmsActions]);

  // Handle connection state changes
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus("connected");
      console.log("✅ HMS Connected - Peers:", peers.map(p => ({ name: p.name, role: p.roleName })));
    }
  }, [isConnected, peers]);

  // Toggle video
  const toggleVideo = async () => {
    try {
      await hmsActions.setLocalVideoEnabled(!isLocalVideoEnabled);
      toast.info(isLocalVideoEnabled ? "Camera disabled" : "Camera enabled");
    } catch (error) {
      console.error("Error toggling video:", error);
      toast.error("Failed to toggle camera");
    }
  };

  // Toggle audio
  const toggleAudio = async () => {
    try {
      await hmsActions.setLocalAudioEnabled(!isLocalAudioEnabled);
      toast.info(isLocalAudioEnabled ? "Microphone muted" : "Microphone enabled");
    } catch (error) {
      console.error("Error toggling audio:", error);
      toast.error("Failed to toggle microphone");
    }
  };

  // End call
  const endCall = async () => {
    try {
      await hmsActions.leave();
      toast.info("Call ended");
      setConnectionStatus("disconnected");
      setTimeout(() => {
        window.close() || window.history.back();
      }, 1000);
    } catch (error) {
      console.error("Error ending call:", error);
      window.history.back();
    }
  };

  // Copy room ID
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success("Room ID copied!");
  };

  // Get connection status color
  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected": return "text-green-400";
      case "connecting": return "text-yellow-400";
      case "joining": return "text-blue-400";
      case "error": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected": return "✅ CONNECTED - Call is live";
      case "connecting": return "🔄 CONNECTING...";
      case "joining": return "🎯 JOINING ROOM...";
      case "error": return "❌ CONNECTION FAILED";
      default: return "🔴 DISCONNECTED";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-700">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {connectionStatus === "connecting" ? "Connecting to 100ms..." : "Joining Room..."}
            </h3>
            <p className="text-gray-400 mb-4 font-mono text-sm">{roomId}</p>
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-300">Share Room ID:</p>
              <div className="flex items-center justify-between bg-black p-3 rounded border border-gray-600">
                <code className="text-emerald-400 text-sm flex-1 truncate mr-2 font-mono">
                  {roomId}
                </code>
                <Button
                  onClick={copyRoomId}
                  size="sm"
                  variant="outline"
                  className="border-gray-600"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              <p>Status: <span className={getStatusColor()}>{connectionStatus}</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-red-700">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Connection Failed
            </h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full bg-emerald-600"
              >
                Retry Connection
              </Button>
              <Button 
                onClick={() => window.history.back()} 
                variant="outline"
                className="w-full border-gray-600"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const remotePeers = peers.filter(peer => peer.id !== localPeer?.id);
  const participantCount = peers.length;

  return (
    <div className="min-h-screen bg-black pt-24 px-4">
      <div className="w-full max-w-6xl mx-auto bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-semibold text-lg truncate">
                Medimeet Video Consultation
              </h2>
              <p className="text-gray-400 text-sm truncate font-mono">
                Room: {roomId}
              </p>
              <p className="text-xs text-emerald-400">
                100ms Professional Video Call
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className={`flex items-center text-sm font-medium ${getStatusColor()}`}>
                <Users className="h-4 w-4 mr-1" />
                <span className="whitespace-nowrap">
                  {participantCount}/2 • {connectionStatus.toUpperCase()}
                </span>
              </div>
              <Button
                onClick={copyRoomId}
                size="sm"
                variant="outline"
                className="border-emerald-600 text-emerald-400 hover:bg-emerald-900/20"
              >
                <Copy className="h-3 w-3 mr-1" /> Copy ID
              </Button>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
          {/* Local Video - YOU */}
          <div className="bg-black rounded-lg overflow-hidden aspect-video relative border-2 border-emerald-600">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover bg-black"
              style={{ transform: 'scaleX(-1)' }}
            />
            <div className="absolute top-3 left-3 bg-emerald-600 text-white px-3 py-1.5 rounded-full text-sm font-medium">
              YOU {localPeer?.roleName === 'host' ? '(DOCTOR)' : '(PATIENT)'}
            </div>
            <div className="absolute bottom-3 left-3 bg-black bg-opacity-80 text-white px-3 py-1.5 rounded-full text-sm border border-gray-500 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`} />
              {localPeer?.name || 'You'} • {localPeer?.roleName || 'Guest'}
            </div>
            {!isLocalVideoEnabled && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <VideoOff className="h-16 w-16 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">Camera Off</p>
                </div>
              </div>
            )}
            {!isLocalAudioEnabled && (
              <div className="absolute top-3 right-3 bg-red-600 p-2 rounded-full">
                <MicOff className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          {/* Remote Video(s) */}
          {remotePeers.length > 0 ? (
            remotePeers.map((peer) => (
              <div 
                key={peer.id}
                className="bg-black rounded-lg overflow-hidden aspect-video relative border-2 border-blue-600"
              >
                <video
                  ref={(el) => {
                    if (el) remoteVideosRef.current[peer.id] = el;
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover bg-black"
                />
                <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                  {peer.roleName === 'host' ? 'DOCTOR' : 'PATIENT'}
                </div>
                <div className="absolute bottom-3 left-3 bg-black bg-opacity-80 text-white px-3 py-1.5 rounded-full text-sm border border-gray-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {peer.name} • {peer.roleName}
                </div>
                {!peer.videoTrack && (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <div className="text-center">
                      <VideoOff className="h-16 w-16 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400">Camera Off</p>
                    </div>
                  </div>
                )}
                {!peer.audioTrack && (
                  <div className="absolute top-3 right-3 bg-red-600 p-2 rounded-full">
                    <MicOff className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-black rounded-lg overflow-hidden aspect-video relative border-2 border-gray-600 flex items-center justify-center">
              <div className="text-center text-gray-400 p-6">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold mb-2">Waiting for participant...</p>
                <p className="text-sm mb-4">Share the room ID to invite others</p>
                <div className="bg-gray-800 rounded p-3 max-w-xs mx-auto">
                  <code className="text-emerald-400 text-xs font-mono break-all">
                    {roomId}
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>

        

        {/* Controls */}
        <div className="bg-gray-800 p-6 border-t border-gray-700">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={toggleVideo}
                size="lg"
                className={`px-6 py-3 h-auto ${
                  isLocalVideoEnabled
                    ? "bg-gray-600 hover:bg-gray-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isLocalVideoEnabled ? (
                  <Video className="h-6 w-6" />
                ) : (
                  <VideoOff className="h-6 w-6" />
                )}
              </Button>

              <Button
                onClick={toggleAudio}
                size="lg"
                className={`px-6 py-3 h-auto ${
                  isLocalAudioEnabled
                    ? "bg-gray-600 hover:bg-gray-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isLocalAudioEnabled ? (
                  <Mic className="h-6 w-6" />
                ) : (
                  <MicOff className="h-6 w-6" />
                )}
              </Button>

              <Button
                onClick={endCall}
                size="lg"
                className="bg-red-600 hover:bg-red-700 px-10 py-3 h-auto text-base font-semibold"
              >
                <PhoneOff className="h-6 w-6 mr-2" /> End Call
              </Button>
            </div>

            <div className="text-center space-y-2">
              <p className="text-gray-400 text-sm">
                {participantCount === 2 
                  ? "✅ Both participants connected - Consultation active"
                  : participantCount === 1
                  ? "⏳ Waiting for other participant to join..."
                  : "🔴 No participants connected"
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}