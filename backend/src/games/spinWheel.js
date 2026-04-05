import { pickRandom, sanitizeListEntries } from "./gameUtils.js";

const DEFAULT_ENTRIES = ["Pizza", "Movie", "Dance", "Mystery", "Snack", "Rematch"];

export default {
  id: "spinWheel",
  name: "Spin the Wheel",
  description: "Customize the wheel entries, spin once, and reveal the same outcome to every player.",
  category: "Fun",
  minPlayers: 2,
  maxPlayers: 16,
  accent: "carnival",
  createInitialState() {
    return {
      entries: DEFAULT_ENTRIES,
      spinning: false,
      pendingResult: null,
      result: null,
      spunBy: null
    };
  },
  onAction({ room, playerId, action, helpers }) {
    const state = room.gameState;

    if (action.type === "setEntries" && playerId === room.hostId) {
      state.entries = sanitizeListEntries(action.payload?.entries, DEFAULT_ENTRIES);
      state.result = null;
      state.pendingResult = null;
      state.spinning = false;
      return;
    }

    if (action.type === "spin" && !state.spinning) {
      const result = pickRandom(state.entries);
      state.spinning = true;
      state.pendingResult = result;
      state.result = null;
      state.spunBy = playerId;

      helpers.scheduleTimer("spinWheel", 1800, () => {
        if (room.currentGameId !== "spinWheel") {
          return;
        }

        room.gameState.spinning = false;
        room.gameState.result = room.gameState.pendingResult;
        room.gameState.pendingResult = null;
      });
      return;
    }

    if (action.type === "reset") {
      helpers.clearTimer("spinWheel");
      room.gameState = {
        entries: state.entries,
        spinning: false,
        pendingResult: null,
        result: null,
        spunBy: null
      };
    }
  },
  serialize({ room }) {
    const { pendingResult, ...publicState } = room.gameState;
    return publicState;
  }
};
