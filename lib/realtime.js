// lib/realtime.js
// Shared in-memory realtime store for presence and signaling

// Presence: roomId -> Map(participantId, lastSeenMs)
const presenceRooms = new Map();
// Presence subscribers: roomId -> Set(callback)
const presenceSubscribers = new Map();

// Signaling messages: roomId -> { messages: Array<{from,to,type,sdp,candidate,timestamp:number}>, createdAt, lastActivity }
const signalingRooms = new Map();
// Signaling subscribers: roomId -> Map(participantId, Set(callback))
const signalingSubscribers = new Map();

function ensurePresenceRoom(roomId) {
  if (!presenceRooms.has(roomId)) {
    presenceRooms.set(roomId, new Map());
  }
  if (!presenceSubscribers.has(roomId)) {
    presenceSubscribers.set(roomId, new Set());
  }
}

function ensureSignalingRoom(roomId) {
  if (!signalingRooms.has(roomId)) {
    signalingRooms.set(roomId, { messages: [], createdAt: Date.now(), lastActivity: Date.now() });
  }
  if (!signalingSubscribers.has(roomId)) {
    signalingSubscribers.set(roomId, new Map());
  }
}

function getParticipants(roomId) {
  const map = presenceRooms.get(roomId);
  return map ? Array.from(map.keys()) : [];
}

function addParticipant(roomId, participantId, now = Date.now()) {
  ensurePresenceRoom(roomId);
  const room = presenceRooms.get(roomId);
  room.set(participantId, now);
  notifyPresence(roomId);
}

function heartbeatParticipant(roomId, participantId, now = Date.now()) {
  ensurePresenceRoom(roomId);
  const room = presenceRooms.get(roomId);
  if (room.has(participantId)) {
    room.set(participantId, now);
  } else {
    room.set(participantId, now);
  }
}

function removeParticipant(roomId, participantId) {
  const room = presenceRooms.get(roomId);
  if (room && room.delete(participantId)) {
    notifyPresence(roomId);
  }
}

function cleanupPresenceRoom(roomId, ttlMs = 30000) {
  const room = presenceRooms.get(roomId);
  if (!room) return;
  const now = Date.now();
  let changed = false;
  for (const [pid, last] of room.entries()) {
    if (now - last > ttlMs) {
      room.delete(pid);
      changed = true;
    }
  }
  if (changed) notifyPresence(roomId);
  if (room.size === 0) {
    // optional: keep room for a while; skip deleting for simplicity
  }
}

function subscribePresence(roomId, cb) {
  ensurePresenceRoom(roomId);
  const set = presenceSubscribers.get(roomId);
  set.add(cb);
  return () => {
    set.delete(cb);
  };
}

function notifyPresence(roomId) {
  const subscribers = presenceSubscribers.get(roomId) || new Set();
  const payload = { participants: getParticipants(roomId), count: getParticipants(roomId).length, timestamp: Date.now() };
  for (const cb of subscribers) {
    try { cb({ event: 'participants_updated', data: payload }); } catch (e) { /* ignore */ }
  }
}

function addSignalingMessage(roomId, message) {
  ensureSignalingRoom(roomId);
  const room = signalingRooms.get(roomId);
  room.messages.push(message);
  room.lastActivity = Date.now();
  // Keep last 200 messages
  if (room.messages.length > 200) {
    room.messages = room.messages.slice(-200);
  }
  // Notify targeted subscribers
  const subsByParticipant = signalingSubscribers.get(roomId);
  const target = message.to;
  if (subsByParticipant && target && subsByParticipant.has(target)) {
    for (const cb of subsByParticipant.get(target)) {
      try { cb({ event: 'signaling', data: message }); } catch (_) {}
    }
  }
}

function getMessagesForParticipant(roomId, participantId, since = 0) {
  const room = signalingRooms.get(roomId);
  if (!room) return [];
  return room.messages.filter((m) => m.to === participantId && m.timestamp > Number(since || 0));
}

function subscribeSignaling(roomId, participantId, cb) {
  ensureSignalingRoom(roomId);
  const map = signalingSubscribers.get(roomId);
  if (!map.has(participantId)) {
    map.set(participantId, new Set());
  }
  const set = map.get(participantId);
  set.add(cb);
  return () => {
    set.delete(cb);
    if (set.size === 0) {
      map.delete(participantId);
    }
  };
}

export {
  presenceRooms,
  signalingRooms,
  addParticipant,
  removeParticipant,
  heartbeatParticipant,
  cleanupPresenceRoom,
  getParticipants,
  subscribePresence,
  notifyPresence,
  addSignalingMessage,
  getMessagesForParticipant,
  subscribeSignaling,
};