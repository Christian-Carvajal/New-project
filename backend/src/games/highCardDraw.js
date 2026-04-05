import { awardPoints, createShuffledDeck, drawCard, getConnectedPlayerIds, getHighCardValue } from "./gameUtils.js";

function resolveDraw(room) {
  const state = room.gameState;
  const activeIds = getConnectedPlayerIds(room);

  if (activeIds.length < 2 || !activeIds.every((playerId) => state.draws[playerId])) {
    return;
  }

  const highestValue = Math.max(...activeIds.map((playerId) => getHighCardValue(state.draws[playerId])));
  const winners = activeIds.filter((playerId) => getHighCardValue(state.draws[playerId]) === highestValue);

  awardPoints(room, winners, 1);
  state.result = {
    winners,
    highestValue
  };
}

export default {
  id: "highCardDraw",
  name: "High Card Draw",
  description: "Everyone draws once from the same deck and the highest card takes the point.",
  category: "Card Games",
  minPlayers: 2,
  maxPlayers: 8,
  accent: "pearl",
  createInitialState() {
    return {
      round: 1,
      deck: createShuffledDeck(),
      draws: {},
      result: null
    };
  },
  onAction({ room, playerId, action }) {
    const state = room.gameState;

    if (action.type === "draw" && !state.draws[playerId] && !state.result) {
      state.draws[playerId] = drawCard(state.deck);
      resolveDraw(room);
      return;
    }

    if (action.type === "reset") {
      room.gameState = {
        round: state.round + 1,
        deck: createShuffledDeck(),
        draws: {},
        result: null
      };
    }
  },
  onPlayerStatusChanged({ room }) {
    if (!room.gameState.result) {
      resolveDraw(room);
    }
  },
  serialize({ room }) {
    return room.gameState;
  }
};
