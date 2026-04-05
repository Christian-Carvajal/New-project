import { awardPoints, getConnectedPlayers, nextConnectedPlayerId, shuffle } from "./gameUtils.js";

const MEMORY_WORDS = ["Nova", "Orbit", "Pulse", "Comet", "Echo", "Prism"];

function createBoard() {
  return shuffle(
    MEMORY_WORDS.flatMap((value, index) => [
      {
        id: `${value}-${index}-A`,
        value,
        matchedBy: null
      },
      {
        id: `${value}-${index}-B`,
        value,
        matchedBy: null
      }
    ])
  );
}

function ensureMatchMap(room, state) {
  room.players.forEach((player) => {
    state.matchesByPlayer[player.id] ??= 0;
  });
}

function finalizeBoard(room) {
  const state = room.gameState;
  const topPairs = Math.max(...Object.values(state.matchesByPlayer), 0);
  const winners = topPairs
    ? Object.entries(state.matchesByPlayer)
        .filter(([, pairs]) => pairs === topPairs)
        .map(([playerId]) => playerId)
    : [];

  state.phase = "finished";
  state.flippedIndices = [];
  state.result = {
    winners,
    topPairs
  };
}

export default {
  id: "memoryMatch",
  name: "Memory Match",
  description: "Play on the same synced board, take turns, and keep pairs with the whole room watching.",
  category: "Interactive",
  minPlayers: 2,
  maxPlayers: 6,
  accent: "aurora",
  createInitialState(room) {
    return {
      round: 1,
      phase: "playing",
      board: createBoard(),
      flippedIndices: [],
      turnPlayerId: getConnectedPlayers(room)[0]?.id ?? null,
      matchesByPlayer: Object.fromEntries(room.players.map((player) => [player.id, 0])),
      moves: 0,
      result: null
    };
  },
  onAction({ room, playerId, action, helpers }) {
    const state = room.gameState;
    ensureMatchMap(room, state);

    if (action.type === "reset") {
      helpers.clearTimer("memoryMismatch");
      room.gameState = {
        round: state.round + 1,
        phase: "playing",
        board: createBoard(),
        flippedIndices: [],
        turnPlayerId: getConnectedPlayers(room)[0]?.id ?? null,
        matchesByPlayer: Object.fromEntries(room.players.map((player) => [player.id, 0])),
        moves: 0,
        result: null
      };
      return;
    }

    if (action.type !== "flip" || state.phase !== "playing" || state.turnPlayerId !== playerId) {
      return;
    }

    const index = Number(action.payload?.index);
    const card = state.board[index];

    if (!Number.isInteger(index) || !card || card.matchedBy || state.flippedIndices.includes(index)) {
      return;
    }

    state.flippedIndices.push(index);

    if (state.flippedIndices.length < 2) {
      return;
    }

    state.moves += 1;
    const [firstIndex, secondIndex] = state.flippedIndices;
    const firstCard = state.board[firstIndex];
    const secondCard = state.board[secondIndex];

    if (firstCard.value === secondCard.value) {
      firstCard.matchedBy = playerId;
      secondCard.matchedBy = playerId;
      state.matchesByPlayer[playerId] = (state.matchesByPlayer[playerId] ?? 0) + 1;
      state.flippedIndices = [];
      awardPoints(room, [playerId], 1);

      if (state.board.every((boardCard) => boardCard.matchedBy)) {
        finalizeBoard(room);
      }

      return;
    }

    state.phase = "resolving";

    helpers.scheduleTimer("memoryMismatch", 1200, () => {
      if (room.currentGameId !== "memoryMatch") {
        return;
      }

      room.gameState.flippedIndices = [];
      room.gameState.phase = "playing";
      room.gameState.turnPlayerId = nextConnectedPlayerId(room, room.gameState.turnPlayerId) ?? room.gameState.turnPlayerId;
    });
  },
  onPlayerStatusChanged({ room, playerId }) {
    const state = room.gameState;
    ensureMatchMap(room, state);
    state.matchesByPlayer[playerId] ??= 0;

    if (state.phase === "playing" && room.players.every((player) => player.id !== state.turnPlayerId || !player.connected)) {
      state.turnPlayerId = nextConnectedPlayerId(room, state.turnPlayerId) ?? null;
    }
  },
  serialize({ room }) {
    const state = room.gameState;

    return {
      ...state,
      cards: state.board.map((card, index) => {
        const isFaceUp = state.flippedIndices.includes(index) || Boolean(card.matchedBy);

        return {
          id: card.id,
          index,
          value: isFaceUp ? card.value : null,
          status: card.matchedBy ? "matched" : isFaceUp ? "faceUp" : "hidden",
          matchedBy: card.matchedBy
        };
      })
    };
  }
};
