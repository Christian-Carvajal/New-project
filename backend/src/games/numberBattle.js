import { awardPoints, clamp, getConnectedPlayerIds, randomInt } from "./gameUtils.js";

function resolveBattle(room) {
  const state = room.gameState;
  const activeIds = getConnectedPlayerIds(room);

  if (activeIds.length < 2 || !activeIds.every((playerId) => state.picks[playerId])) {
    return;
  }

  const target = randomInt(1, state.max);
  const distances = activeIds.map((playerId) => ({
    playerId,
    distance: Math.abs(target - state.picks[playerId])
  }));
  const bestDistance = Math.min(...distances.map((entry) => entry.distance));
  const winners = distances.filter((entry) => entry.distance === bestDistance).map((entry) => entry.playerId);

  awardPoints(room, winners, 1);
  state.target = target;
  state.result = {
    winners,
    target,
    bestDistance
  };
}

export default {
  id: "numberBattle",
  name: "Number Battle",
  description: "Secretly pick a number, then see who landed closest to the random target.",
  category: "Interactive",
  minPlayers: 2,
  maxPlayers: 12,
  accent: "fusion",
  createInitialState() {
    return {
      round: 1,
      max: 50,
      picks: {},
      target: null,
      result: null
    };
  },
  onAction({ room, playerId, action }) {
    const state = room.gameState;

    if (action.type === "setMax" && playerId === room.hostId) {
      state.max = clamp(action.payload?.max ?? 50, 10, 200);
      state.picks = {};
      state.target = null;
      state.result = null;
      return;
    }

    if (action.type === "pick" && !state.result && !state.picks[playerId]) {
      state.picks[playerId] = clamp(action.payload?.value ?? 1, 1, state.max);
      resolveBattle(room);
      return;
    }

    if (action.type === "reset") {
      room.gameState = {
        round: state.round + 1,
        max: state.max,
        picks: {},
        target: null,
        result: null
      };
    }
  },
  onPlayerStatusChanged({ room }) {
    if (!room.gameState.result) {
      resolveBattle(room);
    }
  },
  serialize({ room, playerId }) {
    const state = room.gameState;
    const revealPicks = Boolean(state.result);

    return {
      ...state,
      picks: Object.fromEntries(
        room.players.map((player) => [
          player.id,
          revealPicks || player.id === playerId
            ? state.picks[player.id] ?? null
            : state.picks[player.id]
              ? "locked"
              : null
        ])
      )
    };
  }
};
