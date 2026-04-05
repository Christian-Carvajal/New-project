import { awardPoints, createShuffledDeck, drawCard, getConnectedPlayerIds, getHighCardValue } from "./gameUtils.js";

export default {
  id: "highCardDraw",
  name: "High Card Draw",
  description: "Draw a card from the deck. Highest card wins the round.",
  category: "Card Games",
  minPlayers: 1,
  maxPlayers: 12,
  accent: "pearl",
  createInitialState() {
    return {
      status: "waiting", // waiting | draw | result
      deck: [],
      drawnCards: {},
      winners: []
    };
  },
  serialize({ room, playerId }) {
    const state = room.gameState;
    const isReveal = state.status === "result";

    // Anti-cheat: hide other players' cards until result phase
    const clientCards = {};
    for (const [pId, card] of Object.entries(state.drawnCards)) {
      if (isReveal || pId === playerId) {
        clientCards[pId] = card;
      } else {
        clientCards[pId] = { hidden: true };
      }
    }

    return {
      ...state,
      deck: undefined, // never send the full deck to clients
      drawnCards: clientCards
    };
  },
  onAction({ room, playerId, action }) {
    const state = room.gameState;

    if (action.type === "start" || action.type === "reset") {
      state.status = "draw";
      state.deck = createShuffledDeck();
      state.drawnCards = {};
      state.winners = [];
      return;
    }

    if (state.status !== "draw") return;

    if (action.type === "draw_card" && !state.drawnCards[playerId]) {
      const card = drawCard(state.deck);
      if (!card) return; // deck empty, unlikely

      state.drawnCards[playerId] = card;

      const connectedIds = getConnectedPlayerIds(room);
      const allDrawn = connectedIds.every((id) => state.drawnCards[id]);

      if (allDrawn) {
        state.status = "result";
        
        const highestValue = Math.max(...connectedIds.map((id) => getHighCardValue(state.drawnCards[id]) || 0));
        state.winners = connectedIds.filter((id) => getHighCardValue(state.drawnCards[id]) === highestValue);

        if (state.winners.length > 0) {
          awardPoints(room, state.winners, 1);
        }
      }
    }
  },
  onPlayerStatusChanged({ room }) {
    const state = room.gameState;
    if (state.status === "draw") {
        const connectedIds = getConnectedPlayerIds(room);
        if (connectedIds.length === 0) return;
        const allDrawn = connectedIds.every((id) => state.drawnCards[id]);

        if (allDrawn) {
          state.status = "result";
          const highestValue = Math.max(...connectedIds.map((id) => getHighCardValue(state.drawnCards[id]) || 0));
          state.winners = connectedIds.filter((id) => getHighCardValue(state.drawnCards[id]) === highestValue);

          if (state.winners.length > 0) {
            awardPoints(room, state.winners, 1);
          }
        }
    }
  }
};
