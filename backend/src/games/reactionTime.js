import { awardPoints, getConnectedPlayerIds, getPlayerById, randomInt } from "./gameUtils.js";

export default {
  id: "reactionTime",
  name: "Reaction Time",
  description: "Wait for the random trigger, avoid false starts, and race for the fastest click.",
  category: "Interactive",
  minPlayers: 2,
  maxPlayers: 12,
  accent: "flash",
  createInitialState() {
    return {
      round: 1,
      phase: "idle",
      triggerAt: null,
      triggeredAt: null,
      falseStarts: {},
      winnerId: null,
      reactionMs: null,
      result: null
    };
  },
  onAction({ room, playerId, action, helpers }) {
    const state = room.gameState;

    if (action.type === "start" || action.type === "reset") {
      helpers.clearTimer("reactionTime");

      if (action.type === "reset") {
        room.gameState = {
          round: state.round + 1,
          phase: "idle",
          triggerAt: null,
          triggeredAt: null,
          falseStarts: {},
          winnerId: null,
          reactionMs: null,
          result: null
        };
        return;
      }

      const delay = randomInt(2200, 5000);
      state.phase = "arming";
      state.triggerAt = Date.now() + delay;
      state.triggeredAt = null;
      state.falseStarts = {};
      state.winnerId = null;
      state.reactionMs = null;
      state.result = null;

      helpers.scheduleTimer("reactionTime", delay, () => {
        if (room.currentGameId !== "reactionTime") {
          return;
        }

        room.gameState.phase = "triggered";
        room.gameState.triggerAt = null;
        room.gameState.triggeredAt = Date.now();
      });
      return;
    }

    if (action.type !== "react") {
      return;
    }

    if (state.phase === "arming") {
      state.falseStarts[playerId] = true;

      const eligiblePlayers = getConnectedPlayerIds(room).filter((connectedPlayerId) => !state.falseStarts[connectedPlayerId]);

      if (!eligiblePlayers.length) {
        helpers.clearTimer("reactionTime");
        state.phase = "finished";
        state.triggerAt = null;
        state.result = {
          winnerId: null,
          summary: "Everyone false started."
        };
      }

      return;
    }

    if (state.phase !== "triggered" || state.winnerId || state.falseStarts[playerId] || !getPlayerById(room, playerId)?.connected) {
      return;
    }

    state.winnerId = playerId;
    state.reactionMs = Date.now() - state.triggeredAt;
    state.phase = "finished";
    state.result = {
      winnerId: playerId,
      reactionMs: state.reactionMs
    };
    awardPoints(room, [playerId], 2);
  },
  serialize({ room }) {
    return room.gameState;
  }
};
