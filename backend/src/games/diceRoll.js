import { awardPoints, getConnectedPlayerIds, randomInt } from "./gameUtils.js";

export default {
  id: "diceRoll",
  name: "Dice Roll",
  description: "Roll the highest number on a 6-sided die to win.",
  category: "Simple RNG",
  minPlayers: 1,
  maxPlayers: 12,
  accent: "skyline",
  createInitialState() {
    return {
      status: "waiting", // waiting | rolling | result
      playerRolls: {},
      winners: []
    };
  },
  serialize({ room, playerId }) {
    const state = room.gameState;
    const isReveal = state.status === "result";

    // Anti-cheat: hide others' rolls until everyone rolls
    const clientRolls = {};
    for (const [pId, roll] of Object.entries(state.playerRolls)) {
      if (isReveal || pId === playerId) {
        clientRolls[pId] = roll;
      } else {
        clientRolls[pId] = "hidden";
      }
    }

    return {
      ...state,
      playerRolls: clientRolls
    };
  },
  onAction({ room, playerId, action }) {
    const state = room.gameState;

    if (action.type === "start" || action.type === "reset") {
      state.status = "rolling";
      state.playerRolls = {};
      state.winners = [];
      return;
    }

    if (state.status !== "rolling") return;

    if (action.type === "roll_dice" && !state.playerRolls[playerId]) {
      state.playerRolls[playerId] = randomInt(1, 6);

      const connectedIds = getConnectedPlayerIds(room);
      const allRolled = connectedIds.every((id) => state.playerRolls[id]);

      if (allRolled) {
        state.status = "result";
        
        const highestRoll = Math.max(...connectedIds.map((id) => state.playerRolls[id] || 0));
        state.winners = connectedIds.filter((id) => state.playerRolls[id] === highestRoll);

        if (state.winners.length > 0) {
          awardPoints(room, state.winners, 1);
        }
      }
    }
  },
  onPlayerStatusChanged({ room }) {
    const state = room.gameState;
    if (state.status === "rolling") {
        const connectedIds = getConnectedPlayerIds(room);
        if (connectedIds.length === 0) return;
        const allRolled = connectedIds.every((id) => state.playerRolls[id]);

        if (allRolled) {
          state.status = "result";
          const highestRoll = Math.max(...connectedIds.map((id) => state.playerRolls[id] || 0));
          state.winners = connectedIds.filter((id) => state.playerRolls[id] === highestRoll);

          if (state.winners.length > 0) {
            awardPoints(room, state.winners, 1);
          }
        }
    }
  }
};
