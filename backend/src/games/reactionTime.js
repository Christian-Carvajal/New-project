import { awardPoints, getConnectedPlayerIds } from "./gameUtils.js";

export default {
  id: "reactionTime",
  name: "Reaction Time",
  description: "Wait for the green signal, then click as fast as you can. Don't click early!",
  category: "Reflex",
  minPlayers: 1,
  maxPlayers: 8,
  accent: "green",
  createInitialState() {
    return {
      status: "waiting", // waiting | get_ready | go | result
      round: 1,
      scores: {},
      earlyClickers: [],
      lastResult: null, // { winner: id, time: ms } or null
      targetTime: null
    };
  },
  serialize({ room, playerId }) {
    const state = room.gameState;
    
    // Anti-cheat: Never send targetTime before 'go' state
    // so no clever client can cheat by polling the timer.
    return {
      ...state,
      targetTime: state.status === "go" ? state.targetTime : null
    };
  },
  onAction({ room, playerId, action, helpers }) {
    const state = room.gameState;
    const connectedIds = getConnectedPlayerIds(room);

    if (action.type === "start") {
      helpers.clearTimer("next_round_auto");
      const activeIds = getConnectedPlayerIds(room);
      if (activeIds.length === 0) return;
      
      state.round = 1;
      state.scores = {};
      startRound(room, helpers);
      return;
    }

    if (action.type === "click") {
      if (state.status === "get_ready") {
        // Player clicked before the light turned green!
        if (!state.earlyClickers.includes(playerId)) {
          state.earlyClickers.push(playerId);
        }
        
        // If everyone clicked early, abort the round
        if (state.earlyClickers.length === connectedIds.length) {
           helpers.clearTimer("signal_timer");
           endRound(room, helpers, null);
        }
      } else if (state.status === "go") {
        // First person to click legitimately wins!
        if (state.earlyClickers.includes(playerId)) return; // Disqualified this round
        
        const reactionTime = Date.now() - state.targetTime;
        state.scores[playerId] = (state.scores[playerId] || 0) + 1;
        awardPoints(room, [playerId], 1);
        
        // The first person to hit this logic block inherently ends the round,
        // preventing anyone else from claiming the win.
        endRound(room, helpers, { winner: playerId, time: reactionTime });
      }
    }
  },
  onPlayerStatusChanged({ room, helpers }) {
    // If a player disconnects during go/get_ready and the remaining are all early clickers, resolve it
    const state = room.gameState;
    if (state.status === "get_ready" || state.status === "go") {
        const connectedIds = getConnectedPlayerIds(room);
        if (connectedIds.length > 0 && connectedIds.every(id => state.earlyClickers.includes(id))) {
            helpers.clearTimer("signal_timer");
            endRound(room, helpers, null);
        }
    }
  }
};

function startRound(room, helpers) {
  const state = room.gameState;
  state.status = "get_ready";
  state.earlyClickers = [];
  state.lastResult = null;
  state.targetTime = null;

  getConnectedPlayerIds(room).forEach(id => {
    state.scores[id] ??= 0;
  });

  // Server securely calculates a random delay (2.5s - 7s)
  const delay = Math.floor(Math.random() * 4500) + 2500;
  
  helpers.scheduleTimer("signal_timer", delay, () => {
    if (room.currentGameId !== "reactionTime") return;
    room.gameState.status = "go";
    room.gameState.targetTime = Date.now(); // Official server timestamp
  });
}

function endRound(room, helpers, result) {
  const state = room.gameState;
  state.status = "result";
  state.lastResult = result;
  
  helpers.scheduleTimer("next_round_auto", 3500, () => {
    if (room.currentGameId !== "reactionTime") return;
    state.round += 1;
    startRound(room, helpers);
  });
}
