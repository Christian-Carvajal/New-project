import { awardPoints, getConnectedPlayerIds, randomInt } from "./gameUtils.js";

function resolvePredictions(room) {
  const state = room.gameState;
  const activeIds = getConnectedPlayerIds(room);

  if (activeIds.length < 2 || !activeIds.every((playerId) => state.predictions[playerId])) {
    return;
  }

  const nextValue = randomInt(1, 13);
  const winners = activeIds.filter((playerId) => {
    const prediction = state.predictions[playerId];

    if (nextValue === state.currentValue) {
      return false;
    }

    return (prediction === "higher" && nextValue > state.currentValue) || (prediction === "lower" && nextValue < state.currentValue);
  });

  if (winners.length) {
    awardPoints(room, winners, 1);
  }

  state.revealedValue = nextValue;
  state.result = {
    winners,
    previousValue: state.currentValue,
    nextValue,
    summary:
      nextValue === state.currentValue
        ? "It matched exactly. No points this round."
        : winners.length
          ? `The next value was ${nextValue}.`
          : `The next value was ${nextValue}, and nobody guessed it.`
  };
}

export default {
  id: "higherLower",
  name: "Higher or Lower",
  description: "Predict whether the next reveal climbs or drops from the current number.",
  category: "Simple RNG",
  minPlayers: 2,
  maxPlayers: 10,
  accent: "tidal",
  createInitialState() {
    return {
      round: 1,
      currentValue: randomInt(1, 13),
      predictions: {},
      revealedValue: null,
      result: null
    };
  },
  onAction({ room, playerId, action }) {
    const state = room.gameState;

    if (action.type === "predict" && ["higher", "lower"].includes(action.payload?.value) && !state.result) {
      state.predictions[playerId] = action.payload.value;
      resolvePredictions(room);
      return;
    }

    if ((action.type === "nextRound" || action.type === "reset") && state.result) {
      room.gameState = {
        round: state.round + 1,
        currentValue: state.revealedValue ?? randomInt(1, 13),
        predictions: {},
        revealedValue: null,
        result: null
      };
    }
  },
  onPlayerStatusChanged({ room }) {
    if (!room.gameState.result) {
      resolvePredictions(room);
    }
  },
  serialize({ room, playerId }) {
    const state = room.gameState;
    const revealPredictions = Boolean(state.result);

    return {
      ...state,
      predictions: Object.fromEntries(
        room.players.map((player) => [
          player.id,
          revealPredictions || player.id === playerId
            ? state.predictions[player.id] ?? null
            : state.predictions[player.id]
              ? "locked"
              : null
        ])
      )
    };
  }
};
