import { createGameState, DEFAULT_GAME_ID, gameCatalog, getGameDefinition } from "../games/index.js";
import { clearAllRoomTimers, clearRoomTimer, ensureRuntime, scheduleRoomTimer } from "../games/gameUtils.js";
import {
  addPlayerToRoom,
  createPlayerRecord,
  createPlayerToken,
  createRoomRecord,
  deleteRoom,
  findPlayerByToken,
  getPlayer,
  getRoom,
  removePlayerFromRoom,
  touchRoom
} from "./roomStore.js";

const CHAT_LIMIT = 80;
const RECONNECT_GRACE_MS = 45_000;
const ROOM_IDLE_TTL_MS = 15 * 60_000;

function createMessageId() {
  return `msg_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeUsername(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed.slice(0, 18);
}

function normalizeText(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed.slice(0, 240);
}

function addMessage(room, message) {
  room.messages = [
    ...room.messages,
    {
      id: createMessageId(),
      timestamp: Date.now(),
      ...message
    }
  ].slice(-CHAT_LIMIT);
}

function clearDisconnectTimer(room, playerId) {
  const runtime = ensureRuntime(room);
  const timer = runtime.disconnectTimers[playerId];

  if (timer) {
    clearTimeout(timer);
    delete runtime.disconnectTimers[playerId];
  }
}

function clearCleanupTimer(room) {
  const runtime = ensureRuntime(room);

  if (runtime.cleanupTimer) {
    clearTimeout(runtime.cleanupTimer);
    runtime.cleanupTimer = null;
  }
}

function buildGameHelpers(io, room) {
  return {
    clearTimer(timerKey) {
      clearRoomTimer(room, timerKey);
    },
    scheduleTimer(timerKey, delay, callback) {
      scheduleRoomTimer(room, timerKey, delay, () => {
        callback();
        touchRoom(room);
        emitRoomState(io, room);
      });
    }
  };
}

function serializeRoom(room, playerId) {
  const gameDefinition = getGameDefinition(room.currentGameId);
  const scoreboard = room.players
    .map((player) => ({
      playerId: player.id,
      username: player.username,
      connected: player.connected,
      score: room.sessionScores[player.id] ?? 0
    }))
    .sort((left, right) => right.score - left.score || left.username.localeCompare(right.username));

  return {
    roomId: room.id,
    selfId: playerId,
    hostId: room.hostId,
    players: room.players.map((player) => ({
      id: player.id,
      username: player.username,
      connected: player.connected,
      isHost: room.hostId === player.id
    })),
    scoreboard,
    chat: room.messages,
    games: gameCatalog,
    currentGameId: room.currentGameId,
    currentGame: gameCatalog.find((game) => game.id === room.currentGameId) ?? gameCatalog[0],
    gameState: gameDefinition.serialize({ room, playerId }),
    updatedAt: room.updatedAt
  };
}

function emitRoomState(io, room) {
  room.players.forEach((player) => {
    if (player.connected && player.socketId) {
      io.to(player.socketId).emit("room:state", serializeRoom(room, player.id));
    }
  });
}

function applyPlayerStatusChange(io, room, playerId) {
  const gameDefinition = getGameDefinition(room.currentGameId);
  gameDefinition.onPlayerStatusChanged?.({
    room,
    playerId,
    helpers: buildGameHelpers(io, room)
  });
}

function resetToSelectedGame(room, gameId) {
  clearAllRoomTimers(room);
  room.currentGameId = gameId;
  room.gameState = createGameState(room, gameId);
}

function attachSocketToPlayer(socket, room, player) {
  clearCleanupTimer(room);
  clearDisconnectTimer(room, player.id);
  socket.join(room.id);
  socket.data.roomId = room.id;
  socket.data.playerId = player.id;
  player.socketId = socket.id;
  player.connected = true;
  player.disconnectedAt = null;
  touchRoom(room);
}

function scheduleRoomCleanup(room) {
  if (room.players.some((player) => player.connected)) {
    return;
  }

  const runtime = ensureRuntime(room);

  if (runtime.cleanupTimer) {
    return;
  }

  runtime.cleanupTimer = setTimeout(() => {
    const freshRoom = getRoom(room.id);

    if (!freshRoom) {
      return;
    }

    clearCleanupTimer(freshRoom);

    if (!freshRoom.players.some((player) => player.connected)) {
      clearAllRoomTimers(freshRoom);
      Object.keys(freshRoom.runtime.disconnectTimers).forEach((playerId) => clearDisconnectTimer(freshRoom, playerId));
      deleteRoom(freshRoom.id);
    }
  }, ROOM_IDLE_TTL_MS);
}

function removePlayer(io, room, playerId, reasonText) {
  const player = getPlayer(room, playerId);

  if (!player) {
    return;
  }

  clearDisconnectTimer(room, playerId);
  removePlayerFromRoom(room, playerId);
  addMessage(room, {
    senderName: "PlayTogether",
    text: `${player.username} ${reasonText}.`,
    system: true
  });
  applyPlayerStatusChange(io, room, playerId);
  touchRoom(room);

  if (!room.players.length) {
    clearAllRoomTimers(room);
    deleteRoom(room.id);
    return;
  }

  emitRoomState(io, room);
  scheduleRoomCleanup(room);
}

function getSocketContext(socket) {
  const room = getRoom(socket.data.roomId);

  if (!room) {
    return {
      room: null,
      player: null
    };
  }

  const player = getPlayer(room, socket.data.playerId);

  return {
    room,
    player: player?.socketId === socket.id ? player : null
  };
}

export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    socket.on("room:create", (payload, respond) => {
      const username = normalizeUsername(payload?.username);

      if (!username) {
        respond?.({
          ok: false,
          error: "Choose a username to create a room."
        });
        return;
      }

      const playerToken = payload?.playerToken || createPlayerToken();
      const hostPlayer = createPlayerRecord({
        username,
        token: playerToken,
        socketId: socket.id
      });
      const room = createRoomRecord({
        hostPlayer,
        currentGameId: DEFAULT_GAME_ID
      });

      room.gameState = createGameState(room, DEFAULT_GAME_ID);
      addMessage(room, {
        senderName: "PlayTogether",
        text: `${username} opened the room.`,
        system: true
      });
      attachSocketToPlayer(socket, room, hostPlayer);
      emitRoomState(io, room);

      respond?.({
        ok: true,
        roomId: room.id,
        playerId: hostPlayer.id,
        playerToken
      });
    });

    socket.on("room:join", (payload, respond) => {
      const room = getRoom(payload?.roomId);
      const username = normalizeUsername(payload?.username);

      if (!room) {
        respond?.({
          ok: false,
          error: "That room does not exist anymore."
        });
        return;
      }

      if (!username) {
        respond?.({
          ok: false,
          error: "Choose a username to join the room."
        });
        return;
      }

      const existingPlayer = findPlayerByToken(room, payload?.playerToken);

      if (existingPlayer) {
        const wasConnected = existingPlayer.connected;
        existingPlayer.username = username;
        attachSocketToPlayer(socket, room, existingPlayer);

        if (!wasConnected) {
          addMessage(room, {
            senderName: "PlayTogether",
            text: `${existingPlayer.username} rejoined the room.`,
            system: true
          });
          applyPlayerStatusChange(io, room, existingPlayer.id);
        }

        emitRoomState(io, room);
        respond?.({
          ok: true,
          roomId: room.id,
          playerId: existingPlayer.id,
          playerToken: existingPlayer.token
        });
        return;
      }

      const playerToken = createPlayerToken();
      const newPlayer = createPlayerRecord({
        username,
        token: playerToken,
        socketId: socket.id
      });

      addPlayerToRoom(room, newPlayer);
      attachSocketToPlayer(socket, room, newPlayer);
      addMessage(room, {
        senderName: "PlayTogether",
        text: `${username} joined the room.`,
        system: true
      });
      applyPlayerStatusChange(io, room, newPlayer.id);
      emitRoomState(io, room);

      respond?.({
        ok: true,
        roomId: room.id,
        playerId: newPlayer.id,
        playerToken
      });
    });

    socket.on("chat:send", (payload, respond) => {
      const { room, player } = getSocketContext(socket);
      const text = normalizeText(payload?.text);

      if (!room || !player) {
        respond?.({
          ok: false,
          error: "Join a room before chatting."
        });
        return;
      }

      if (!text) {
        respond?.({
          ok: false,
          error: "Type a message first."
        });
        return;
      }

      addMessage(room, {
        senderId: player.id,
        senderName: player.username,
        text,
        system: false
      });
      touchRoom(room);
      emitRoomState(io, room);
      respond?.({ ok: true });
    });

    socket.on("game:select", (payload, respond) => {
      const { room, player } = getSocketContext(socket);
      const gameId = getGameDefinition(payload?.gameId).id;

      if (!room || !player) {
        respond?.({
          ok: false,
          error: "Join a room before selecting a game."
        });
        return;
      }

      if (player.id !== room.hostId) {
        respond?.({
          ok: false,
          error: "Only the host can switch games."
        });
        return;
      }

      resetToSelectedGame(room, gameId);
      addMessage(room, {
        senderName: "PlayTogether",
        text: `${player.username} switched to ${getGameDefinition(gameId).name}.`,
        system: true
      });
      touchRoom(room);
      emitRoomState(io, room);
      respond?.({ ok: true });
    });

    socket.on("game:reset", (_payload, respond) => {
      const { room, player } = getSocketContext(socket);

      if (!room || !player) {
        respond?.({
          ok: false,
          error: "Join a room before resetting the game."
        });
        return;
      }

      if (player.id !== room.hostId) {
        respond?.({
          ok: false,
          error: "Only the host can reset the current game."
        });
        return;
      }

      const gameDefinition = getGameDefinition(room.currentGameId);
      clearAllRoomTimers(room);
      gameDefinition.onAction?.({
        room,
        playerId: player.id,
        action: {
          type: "reset"
        },
        helpers: buildGameHelpers(io, room)
      });
      touchRoom(room);
      emitRoomState(io, room);
      respond?.({ ok: true });
    });

    socket.on("game:action", (payload, respond) => {
      const { room, player } = getSocketContext(socket);

      if (!room || !player) {
        respond?.({
          ok: false,
          error: "Join a room before playing."
        });
        return;
      }

      const gameDefinition = getGameDefinition(room.currentGameId);

      gameDefinition.onAction?.({
        room,
        playerId: player.id,
        action: payload ?? {},
        helpers: buildGameHelpers(io, room)
      });
      touchRoom(room);
      emitRoomState(io, room);
      respond?.({ ok: true });
    });

    socket.on("room:leave", (_payload, respond) => {
      const { room, player } = getSocketContext(socket);

      if (!room || !player) {
        respond?.({ ok: true });
        return;
      }

      socket.leave(room.id);
      removePlayer(io, room, player.id, "left");
      respond?.({ ok: true });
    });

    socket.on("disconnect", () => {
      const { room, player } = getSocketContext(socket);

      if (!room || !player || player.socketId !== socket.id) {
        return;
      }

      player.connected = false;
      player.socketId = null;
      player.disconnectedAt = Date.now();
      addMessage(room, {
        senderName: "PlayTogether",
        text: `${player.username} disconnected. Reconnect to keep the same seat.`,
        system: true
      });
      applyPlayerStatusChange(io, room, player.id);
      touchRoom(room);
      emitRoomState(io, room);
      scheduleRoomCleanup(room);

      ensureRuntime(room).disconnectTimers[player.id] = setTimeout(() => {
        const freshRoom = getRoom(room.id);

        if (!freshRoom) {
          return;
        }

        const freshPlayer = getPlayer(freshRoom, player.id);

        if (!freshPlayer || freshPlayer.connected) {
          clearDisconnectTimer(freshRoom, player.id);
          return;
        }

        removePlayer(io, freshRoom, player.id, "timed out");
      }, RECONNECT_GRACE_MS);
    });
  });
}
