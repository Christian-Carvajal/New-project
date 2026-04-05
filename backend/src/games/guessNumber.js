import { clamp, randomInt } from "./gameUtils.js";

function resetRound(state, room, target) {
  state.round += 1;
  state.guesses = [];
  state.feedbackByPlayer = {};
  state.winnerId = null;
  state.status = target ? "active" : "awaitingTarget";
  state.target = target;
  state.setterId = state.mode === "host" ? room.hostId : null;
}

export default {
  id: "guessNumber",
  name: "Guess the Number",
  description: "Use a host-set or random number, then guide everyone with higher or lower hints.",
  category: "Simple RNG",
  minPlayers: 2,
  maxPlayers: 10,
  accent: "ember",
  createInitialState() {
    return {
      round: 1,
      mode: "system",
      max: 100,
      status: "active",
      target: randomInt(1, 100),
      setterId: null,
      winnerId: null,
      guesses: [],
      feedbackByPlayer: {}
    };
  },
  onAction({ room, playerId, action }) {
    const state = room.gameState;

    if (action.type === "configure" && playerId === room.hostId) {
      state.mode = action.payload?.mode === "host" ? "host" : "system";
      state.max = clamp(action.payload?.max ?? state.max, 10, 500);

      if (state.mode === "host") {
        const target = Number(action.payload?.target);
        resetRound(state, room, Number.isInteger(target) && target >= 1 && target <= state.max ? target : null);
        return;
      }

      resetRound(state, room, randomInt(1, state.max));
      return;
    }

    if (action.type === "setTarget" && playerId === room.hostId && state.mode === "host") {
      const target = Number(action.payload?.target);

      if (Number.isInteger(target) && target >= 1 && target <= state.max) {
        resetRound(state, room, target);
      }

      return;
    }

    if (action.type === "guess" && state.status === "active" && state.target) {
      if (state.mode === "host" && playerId === state.setterId) {
        return;
      }

      const guess = clamp(action.payload?.guess ?? 0, 1, state.max);
      const hint = guess === state.target ? "Correct!" : guess < state.target ? "Too low." : "Too high.";

      state.feedbackByPlayer[playerId] = hint;
      state.guesses = [
        {
          playerId,
          guess,
          hint,
          timestamp: Date.now()
        },
        ...state.guesses
      ].slice(0, 20);

      if (guess === state.target) {
        state.status = "finished";
        state.winnerId = playerId;
        room.sessionScores[playerId] = (room.sessionScores[playerId] ?? 0) + 2;
      }

      return;
    }

    if (action.type === "reset" && playerId === room.hostId) {
      if (state.mode === "host") {
        resetRound(state, room, null);
        return;
      }

      resetRound(state, room, randomInt(1, state.max));
    }
  },
  serialize({ room, playerId }) {
    const state = room.gameState;
    const isSetter = state.setterId === playerId;
    const revealTarget = state.status === "finished" || isSetter;

    return {
      ...state,
      target: revealTarget ? state.target : null,
      canGuess: !(state.mode === "host" && isSetter),
      yourHint: state.feedbackByPlayer[playerId] ?? null
    };
  }
};
