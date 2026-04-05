import { awardPoints, getConnectedPlayerIds, pickRandom } from "./gameUtils.js";

const SIDES = ["Heads", "Tails"];

export default {
  id: "coinToss",
  name: "Coin Toss",
  description: "Predict the coin flip. Correct guesses win points.",
  category: "Simple RNG",
  minPlayers: 1,
  maxPlayers: 12,
  accent: "citrus",
  createInitialState() {
    return {
      status: "waiting", // waiting | choosing | result
      playerChoices: {},
      coinResult: null,
      winners: []
    };
  },
  serialize({ room, playerId }) {
    const state = room.gameState;
    const isReveal = state.status === "result";

    // Anti-cheat: don't broadcast exact choices of opponents until result
    const clientChoices = {};
    for (const [pId, choice] of Object.entries(state.playerChoices)) {
      if (isReveal || pId === playerId) {
        clientChoices[pId] = choice;
      } else {
        clientChoices[pId] = "hidden";
      }
    }

    return {
      ...state,
      playerChoices: clientChoices
    };
  },
  onAction({ room, playerId, action }) {
    const state = room.gameState;

    if (action.type === "start" || action.type === "reset") {
      state.status = "choosing";
      state.playerChoices = {};
      state.coinResult = null;
      state.winners = [];
      return;
    }

    if (state.status !== "choosing") {
      return;
    }

    if (action.type === "choose_side" && SIDES.includes(action.payload?.side)) {
      state.playerChoices[playerId] = action.payload.side;
      return;
    }

    if (action.type === "flip_coin") {
      state.coinResult = pickRandom(SIDES);
      state.status = "result";
      state.winners = [];

      const connectedIds = getConnectedPlayerIds(room);
      connectedIds.forEach((id) => {
        if (state.playerChoices[id] === state.coinResult) {
          state.winners.push(id);
        }
      });

      if (state.winners.length > 0) {
        awardPoints(room, state.winners, 1);
      }
    }
  }
};
