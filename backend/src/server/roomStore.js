const rooms = new Map();

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TOKEN_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function makeId(length, alphabet) {
  let output = "";

  for (let index = 0; index < length; index += 1) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return output;
}

export function createRoomId() {
  let roomId = "";

  do {
    roomId = makeId(6, ROOM_ALPHABET);
  } while (rooms.has(roomId));

  return roomId;
}

export function createPlayerToken() {
  return makeId(20, TOKEN_ALPHABET);
}

export function createPlayerRecord({ username, token, socketId }) {
  return {
    id: makeId(10, TOKEN_ALPHABET),
    username,
    token,
    socketId,
    connected: true,
    joinedAt: Date.now(),
    disconnectedAt: null
  };
}

export function createRoomRecord({ hostPlayer, currentGameId }) {
  const room = {
    id: createRoomId(),
    hostId: hostPlayer.id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    currentGameId,
    gameState: null,
    players: [hostPlayer],
    sessionScores: {
      [hostPlayer.id]: 0
    },
    messages: [],
    runtime: {
      timers: {},
      disconnectTimers: {},
      cleanupTimer: null
    }
  };

  rooms.set(room.id, room);
  return room;
}

export function touchRoom(room) {
  room.updatedAt = Date.now();
}

export function getRoom(roomId) {
  if (!roomId) {
    return null;
  }

  return rooms.get(String(roomId).toUpperCase()) ?? null;
}

export function deleteRoom(roomId) {
  const room = getRoom(roomId);

  if (!room) {
    return null;
  }

  rooms.delete(room.id);
  return room;
}

export function getPlayer(room, playerId) {
  return room.players.find((player) => player.id === playerId) ?? null;
}

export function findPlayerByToken(room, token) {
  if (!token) {
    return null;
  }

  return room.players.find((player) => player.token === token) ?? null;
}

export function addPlayerToRoom(room, player) {
  room.players.push(player);
  room.sessionScores[player.id] ??= 0;
  touchRoom(room);
}

export function removePlayerFromRoom(room, playerId) {
  room.players = room.players.filter((player) => player.id !== playerId);
  delete room.sessionScores[playerId];

  if (!room.players.some((player) => player.id === room.hostId)) {
    room.hostId = room.players[0]?.id ?? null;
  }

  touchRoom(room);
}
