import { awardPoints, getConnectedPlayerIds } from "./gameUtils.js";

export default {
  id: "numberBattle",
  name: "Number Battle",
  description: "A strategic game of numbers. Highest wins, but 1 beats the opponent's highest available number!",
  category: "Strategy",
  minPlayers: 2,
  maxPlayers: 4,
  accent: "red",
  createInitialState() {
    return {
      status: "waiting", // waiting | playing | result | finished
      round: 1,
      playerStates: {},
      lastRoundResult: null
    };
  },
  serialize({ room, playerId }) {
    const state = room.gameState;
    const connectedIds = getConnectedPlayerIds(room);
    
    // Hide selected numbers of others to prevent cheating
    const securePlayerStates = {};
    for (const [id, pState] of Object.entries(state.playerStates)) {
      securePlayerStates[id] = {
        ...pState,
        selected: (state.status === "result" || state.status === "finished" || id === playerId) 
          ? pState.selected 
          : (pState.selected !== null ? "hidden" : null),
      };
    }

    return {
      ...state,
      playerStates: securePlayerStates,
      connectedIds
    };
  },
  onAction({ room, playerId, action, helpers }) {
    const state = room.gameState;

    if (action.type === "start") {
      helpers.clearTimer("next_round_auto");
      const connectedIds = getConnectedPlayerIds(room);
      if (connectedIds.length < 2) return;

      state.status = "playing";
      state.round = 1;
      state.playerStates = {};
      connectedIds.forEach(id => {
        state.playerStates[id] = {
          available: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          selected: null,
          locked: false,
          score: 0,
          streak: 1
        };
      });
      state.lastRoundResult = null;
      return;
    }

    if (state.status !== "playing") return;

    const pState = state.playerStates[playerId];
    if (!pState) return;

    if (action.type === "choose_number" && !pState.locked) {
      const num = Number(action.payload?.number);
      if (pState.available.includes(num)) {
        pState.selected = num;
      }
      return;
    }

    if (action.type === "lock" && pState.selected !== null) {
      pState.locked = true;
      
      const connectedIds = getConnectedPlayerIds(room);
      const allLocked = connectedIds.every(id => state.playerStates[id]?.locked);
      
      if (allLocked) {
        evaluateRound(room, helpers);
      }
    }
  },
  onPlayerStatusChanged({ room, helpers }) {
    const state = room.gameState;
    if (state.status === "playing") {
      const connectedIds = getConnectedPlayerIds(room);
      const allLocked = connectedIds.every(id => state.playerStates[id]?.locked);
      if (allLocked && connectedIds.length > 0) {
        evaluateRound(room, helpers);
      } else if (connectedIds.length <= 1) {
        state.status = "finished";
      }
    }
  }
};

function evaluateRound(room, helpers) {
  const state = room.gameState;
  const connectedIds = getConnectedPlayerIds(room);
  
  const plays = connectedIds.map(id => {
    const pState = state.playerStates[id];
    return {
      id,
      num: pState.selected,
      maxAvail: Math.max(...pState.available)
    };
  });

  // Determine actual numbers played
  const maxPlayed = Math.max(...plays.map(p => p.num));
  const ones = plays.filter(p => p.num === 1);
  const opponentsWithMax = plays.filter(p => p.num === p.maxAvail && p.num === maxPlayed && p.num > 1);
  
  let winners = [];
  let basePoints = 1;
  let critical = false;
  let tie = false;

  // CRITICAL RULE: 1 beats Opponent's highest available number
  if (ones.length > 0 && opponentsWithMax.length > 0) {
    if (ones.length === 1) {
      winners = [ones[0].id];
      basePoints = 2; // Extra points for critical
      critical = true;
    } else {
      tie = true; // Multiple 1s tie on critical
    }
  } else {
    // Normal rules
    const maxPlayers = plays.filter(p => p.num === maxPlayed);
    if (maxPlayers.length === 1) {
      winners = [maxPlayers[0].id];
    } else {
      tie = true; // TIE RULE: Same number, no points
    }
  }

  // Apply Changes
  const roundResult = { plays: {}, winners, critical, tie, pointsAwarded: {} };
  
  connectedIds.forEach(id => {
    const pState = state.playerStates[id];
    roundResult.plays[id] = pState.selected;
    
    // Remove used number PERMANENTLY
    pState.available = pState.available.filter(n => n !== pState.selected);
    
    if (winners.includes(id)) {
      // COMBO SYSTEM: base points * streak
      const points = basePoints * pState.streak;
      pState.score += points;
      roundResult.pointsAwarded[id] = points;
      pState.streak += 1;
      awardPoints(room, [id], points);
    } else {
      // Lose or Tie resets streak
      pState.streak = 1;
      roundResult.pointsAwarded[id] = 0;
    }
  });

  state.lastRoundResult = roundResult;
  state.status = "result";

  // Check if everyone is out of numbers
  const outOfNumbers = connectedIds.every(id => state.playerStates[id].available.length === 0);
  
  helpers.scheduleTimer("next_round_auto", 4000, () => {
    if (room.currentGameId !== "numberBattle") return;
    
    if (outOfNumbers) {
      room.gameState.status = "finished";
    } else {
      room.gameState.status = "playing";
      room.gameState.round += 1;
      room.gameState.lastRoundResult = null;
      connectedIds.forEach(id => {
        if (room.gameState.playerStates[id]) {
          room.gameState.playerStates[id].selected = null;
          room.gameState.playerStates[id].locked = false;
        }
      });
    }
  });
}
