import { awardPoints, clamp, getConnectedPlayerIds, randomInt } from "./gameUtils.js";

function resolveDiceRound(room) {
  const state = room.gameState;
  const activeIds = getConnectedPlayerIds(room);

  if (activeIds.length < 2 || !activeIds.every((playerId) => state.rolls[playerId])) {
    return;
  }

  const highestRoll = Math.max(...activeIds.map((playerId) => state.rolls[playerId]));
  const winners = activeIds.filter((playerId) => state.rolls[playerId] === highestRoll);

  awardPoints(room, winners, 1);
  state.result = {
    highestRoll,
    winners,
    summary: winners.length > 1 ? `A tie at ${highestRoll}.` : `Top roll: ${highestRoll}.`
  };
}

export default {
  id: "diceRoll",
  name: "Dice Roll",
  description: "Customize the dice, roll once per round, and award the highest total.",
  category: "Simple RNG",
  minPlayers: 2,
  maxPlayers: 12,
  accent: "skyline",
  createInitialState() {
    return {
      round: 1,
      sides: 6,
      rolls: {},
      result: null
    };
  },
  onAction({ room, playerId, action }) {
    const state = room.gameState;

    if (action.type === "setSides" && playerId === room.hostId) {
      state.sides = clamp(action.payload?.sides ?? 6, 4, 100);
      state.rolls = {};
      state.result = null;
      return;
    }

    if (action.type === "roll" && !state.rolls[playerId]) {
      state.rolls[playerId] = randomInt(1, state.sides);
      resolveDiceRound(room);
      return;
    }

    if (action.type === "reset") {
      room.gameState = {
        round: state.round + 1,
        sides: state.sides,
        rolls: {},
        result: null
      };
    }
  },
  onPlayerStatusChanged({ room }) {
    if (!room.gameState.result) {
      resolveDiceRound(room);
    }
  },
  serialize({ room }) {
    return room.gameState;
  }
};
