import { pickRandom } from "./gameUtils.js";

const SIDES = ["Heads", "Tails"];

export default {
  id: "coinToss",
  name: "Coin Toss",
  description: "Flip a shared coin and reveal one synchronized result for the whole room.",
  category: "Simple RNG",
  minPlayers: 2,
  maxPlayers: 12,
  accent: "citrus",
  createInitialState() {
    return {
      flipCount: 0,
      lastResult: null,
      history: []
    };
  },
  onAction({ room, playerId, action }) {
    if (action.type === "reset") {
      room.gameState = {
        flipCount: 0,
        lastResult: null,
        history: []
      };
      return;
    }

    if (action.type !== "flip") {
      return;
    }

    const state = room.gameState;
    const result = {
      side: pickRandom(SIDES),
      flippedBy: playerId,
      timestamp: Date.now()
    };

    state.flipCount += 1;
    state.lastResult = result;
    state.history = [result, ...state.history].slice(0, 8);
  },
  serialize({ room }) {
    return room.gameState;
  }
};
