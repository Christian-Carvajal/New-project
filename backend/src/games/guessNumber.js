import { clamp } from "./gameUtils.js";

function resetRound(state) {
  state.status = state.activePlayers.length === 2 ? "setup" : "waiting";
  state.targets = {};
  state.locked = {};
  state.turnId = null;
  state.winnerId = null;
  state.guesses = [];
  state.result = null;
}

export default {
  id: "guessNumber",
  name: "Number Duel",
  description: "Pick a secret number, lock it in, and race to guess your opponent's number first.",
  category: "Duel",
  minPlayers: 2,
  maxPlayers: 2,
  accent: "indigo",
  createInitialState() {
    return {
      max: 100,
      activePlayers: [],
      status: "waiting", // waiting, setup, playing, finished
      locked: {},
      targets: {},
      turnId: null,
      winnerId: null,
      guesses: [],
      result: null
    };
  },
  onAction({ room, playerId, action }) {
    const state = room.gameState;

    if (action.type === "join" && state.status === "waiting") {
      if (!state.activePlayers.includes(playerId) && state.activePlayers.length < 2) {
        state.activePlayers.push(playerId);
      }
      if (state.activePlayers.length === 2) {
        state.status = "setup";
      }
      return;
    }

    if (action.type === "leave" && state.status !== "finished") {
      state.activePlayers = state.activePlayers.filter((id) => id !== playerId);
      resetRound(state);
      return;
    }

    if (action.type === "lock" && state.status === "setup") {
      if (!state.activePlayers.includes(playerId)) return;
      const target = clamp(action.payload?.target ?? 1, 1, state.max);
      
      state.targets[playerId] = target;
      state.locked[playerId] = true;

      if (state.locked[state.activePlayers[0]] && state.locked[state.activePlayers[1]]) {
        state.status = "playing";
        // To be fair, randomize who goes first, or just player 1
        state.turnId = state.activePlayers[0];
      }
      return;
    }

    if (action.type === "guess" && state.status === "playing") {
      if (state.turnId !== playerId) return;

      const opponentId = state.activePlayers.find(id => id !== playerId);
      const opponentTarget = state.targets[opponentId];
      if (!opponentTarget) return;

      const guess = clamp(action.payload?.guess ?? 1, 1, state.max);
      let hint;
      if (guess === opponentTarget) hint = "correct";
      else if (guess < opponentTarget) hint = "too low";
      else hint = "too high";

      state.guesses = [
        {
          playerId,
          guess,
          hint,
          timestamp: Date.now()
        },
        ...state.guesses
      ].slice(0, 30);

      if (hint === "correct") {
        state.status = "finished";
        state.winnerId = playerId;
        state.result = {
          winnerId: playerId,
          targets: state.targets
        };
        room.sessionScores[playerId] = (room.sessionScores[playerId] ?? 0) + 2;
      } else {
        state.turnId = opponentId;
      }
      return;
    }

    if (action.type === "reset" && playerId === room.hostId) {
      resetRound(state);
    }
  },
  serialize({ room, playerId }) {
    const state = room.gameState;
    const isFinished = state.status === "finished";

    // Hide opponent's target until finished
    const visibleTargets = {};
    if (state.activePlayers.includes(playerId)) {
      visibleTargets[playerId] = state.targets[playerId];
    }
    
    if (isFinished) {
      Object.assign(visibleTargets, state.targets);
    }

    return {
      ...state,
      targets: visibleTargets
    };
  }
};
