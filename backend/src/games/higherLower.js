import { awardPoints, getConnectedPlayerIds, randomInt } from "./gameUtils.js";

export default {
  id: "higherLower",
  name: "Higher or Lower",
  description: "Guess whether the next number will be higher or lower. Correct guess wins a point.",
  category: "Simple RNG",
  minPlayers: 1,
  maxPlayers: 12,
  accent: "tidal",
  createInitialState() {
    return {
      status: "waiting", // waiting | choosing | result
      currentValue: null,
      nextValue: null,
      playerGuesses: {},
      winners: []
    };
  },
  serialize({ room, playerId }) {
    const state = room.gameState;
    const isReveal = state.status === "result";

    // Anti-cheat: hide other players' guesses until result phase
    const clientGuesses = {};
    for (const [pId, guess] of Object.entries(state.playerGuesses)) {
      if (isReveal || pId === playerId) {
        clientGuesses[pId] = guess;
      } else {
        clientGuesses[pId] = "hidden";
      }
    }

    return {
      ...state,
      nextValue: isReveal ? state.nextValue : undefined,
      playerGuesses: clientGuesses
    };
  },
  onAction({ room, playerId, action }) {
    const state = room.gameState;

    if (action.type === "start" || action.type === "reset" || action.type === "next_round") {
      state.status = "choosing";
      state.currentValue = state.nextValue ?? randomInt(1, 13);
      state.nextValue = randomInt(1, 13);
      
      // reroll if same to avoid ties making everyone lose automatically, or just let ties be a loss
      while(state.nextValue === state.currentValue) {
        state.nextValue = randomInt(1, 13);
      }

      state.playerGuesses = {};
      state.winners = [];
      return;
    }

    if (state.status !== "choosing") return;

    if (action.type === "guess" && ["higher", "lower"].includes(action.payload?.value) && !state.playerGuesses[playerId]) {
      state.playerGuesses[playerId] = action.payload.value;

      const connectedIds = getConnectedPlayerIds(room);
      const allGuessed = connectedIds.every((id) => state.playerGuesses[id]);

      if (allGuessed) {
        state.status = "result";
        
        state.winners = connectedIds.filter((id) => {
          const g = state.playerGuesses[id];
          return (g === "higher" && state.nextValue > state.currentValue) || 
                 (g === "lower" && state.nextValue < state.currentValue);
        });

        if (state.winners.length > 0) {
          awardPoints(room, state.winners, 1);
        }
      }
    }
  },
  onPlayerStatusChanged({ room }) {
    const state = room.gameState;
    if (state.status === "choosing") {
        const connectedIds = getConnectedPlayerIds(room);
        if (connectedIds.length === 0) return;
        const allGuessed = connectedIds.every((id) => state.playerGuesses[id]);

        if (allGuessed) {
          state.status = "result";
          state.winners = connectedIds.filter((id) => {
            const g = state.playerGuesses[id];
            return (g === "higher" && state.nextValue > state.currentValue) || 
                   (g === "lower" && state.nextValue < state.currentValue);
          });

          if (state.winners.length > 0) {
            awardPoints(room, state.winners, 1);
          }
        }
    }
  }
};
