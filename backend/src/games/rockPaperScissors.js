import { awardPoints, getConnectedPlayerIds } from "./gameUtils.js";

export default {
  id: "rockPaperScissors",
  name: "Rock Paper Scissors",
  description: "A strategic RPS battle with HP, limited moves, and special abilities limit!",
  category: "Strategy",
  minPlayers: 2,
  maxPlayers: 2,
  accent: "blue",
  createInitialState() {
    return {
      status: "waiting", // waiting | choosing | optional_swap | result | finished
      round: 1,
      startingHp: 5,
      playerStates: {},
      lastResult: null,
    };
  },
  serialize({ room, playerId }) {
    const state = room.gameState;
    const secureStates = {};
    const showMoves = state.status === "result" || state.status === "finished";

    for (const [id, pState] of Object.entries(state.playerStates || {})) {
      secureStates[id] = {
        ...pState,
        selected: (showMoves || id === playerId) ? pState.selected : (pState.selected ? "hidden" : null),
      };
    }

    return {
      ...state,
      playerStates: secureStates,
      connectedIds: getConnectedPlayerIds(room),
    };
  },
  onAction({ room, playerId, action, helpers }) {
    const state = room.gameState;
    const connectedIds = getConnectedPlayerIds(room);

    if (action.type === "set_hp" && state.status === "waiting") {
      const hp = Number(action.payload?.hp) || 5;
      if ([3, 5, 7, 9].includes(hp)) state.startingHp = hp;
      return;
    }

    if (action.type === "start" && state.status === "waiting") {
      helpers.clearTimer("state_advance");
      if (connectedIds.length !== 2) return;

      state.status = "choosing";
      state.round = 1;
      state.lastResult = null;
      
      const moveLimit = Math.ceil(state.startingHp * 0.8);
      
      state.playerStates = {};
      connectedIds.forEach(id => {
        state.playerStates[id] = {
          hp: state.startingHp,
          moves: { rock: moveLimit, paper: moveLimit, scissors: moveLimit },
          selected: null,
          locked: false,
          streak: 1,
          shieldActive: false,
          shieldAvailable: 1,
          swapAvailable: 1,
        };
      });
      return;
    }

    const pState = state.playerStates[playerId];
    if (!pState) return;

    if (action.type === "choose_move" && state.status === "choosing" && !pState.locked) {
      if (["rock", "paper", "scissors"].includes(action.payload?.move)) {
        pState.selected = action.payload.move;
      }
      return;
    }
    
    if (action.type === "toggle_shield" && state.status === "choosing" && !pState.locked) {
      if (pState.shieldAvailable > 0 || pState.shieldActive) {
        if (!pState.shieldActive) {
          pState.shieldActive = true;
          pState.shieldAvailable = 0;
        } else {
          pState.shieldActive = false;
          pState.shieldAvailable = 1;
        }
      }
      return;
    }

    if (action.type === "lock_move" && state.status === "choosing" && pState.selected) {
      pState.locked = true;
      const allLocked = connectedIds.every(id => state.playerStates[id]?.locked);
      if (allLocked) {
        state.status = "optional_swap";
        
        helpers.scheduleTimer("state_advance", 5000, () => {
          if (room.currentGameId !== "rockPaperScissors") return;
          evaluateRound(room, helpers);
        });
      }
      return;
    }

    if (action.type === "use_swap" && state.status === "optional_swap") {
      if (pState.swapAvailable > 0 && ["rock", "paper", "scissors"].includes(action.payload?.move)) {
        pState.selected = action.payload.move;
        pState.swapAvailable = 0;
      }
      return;
    }
  },
  onPlayerStatusChanged({ room, helpers }) {
    const state = room.gameState;
    const connectedIds = getConnectedPlayerIds(room);
    
    if (state.status !== "waiting" && connectedIds.length < 2) {
      state.status = "finished";
      helpers.clearTimer("state_advance");
    }
  }
};

function evaluateRound(room, helpers) {
  const state = room.gameState;
  const connectedIds = getConnectedPlayerIds(room);
  
  if (connectedIds.length !== 2) return;
  const [id1, id2] = connectedIds;
  const p1 = state.playerStates[id1];
  const p2 = state.playerStates[id2];

  const m1 = p1.selected;
  const m2 = p2.selected;

  let winnerId = null;
  let loserId = null;
  let tie = false;

  if (m1 === m2) {
    tie = true;
  } else if (
    (m1 === "rock" && m2 === "scissors") ||
    (m1 === "paper" && m2 === "rock") ||
    (m1 === "scissors" && m2 === "paper")
  ) {
    winnerId = id1;
    loserId = id2;
  } else {
    winnerId = id2;
    loserId = id1;
  }

  const reduceMoveCount = (pData) => {
      if (pData.moves[pData.selected] > 0) {
          pData.moves[pData.selected] -= 1;
          return true; // Had stock
      }
      return false; // Spamming at 0
  };

  const p1HadStock = reduceMoveCount(p1);
  const p2HadStock = reduceMoveCount(p2);

  let damageDealt = 0;
  let shieldBlocked = false;

  if (!tie && winnerId && loserId) {
    const winner = state.playerStates[winnerId];
    const loser = state.playerStates[loserId];
    const winnerHadStock = winnerId === id1 ? p1HadStock : p2HadStock;
    
    let baseDamage = 1 + (winner.streak - 1);
    if (!winnerHadStock) baseDamage *= 0.5;

    if (loser.shieldActive) {
      shieldBlocked = true;
      loser.shieldActive = false; // block consumed
    } else {
      loser.hp -= baseDamage;
      if (loser.hp < 0) loser.hp = 0;
    }

    winner.streak += 1;
    loser.streak = 1;
    awardPoints(room, [winnerId], 1);
  } else if (tie) {
    p1.streak = 1;
    p2.streak = 1;
  }

  // Ensure shields are turned off if not used to block (already consumed availability)
  if (p1.shieldActive && !shieldBlocked && loserId !== id1) p1.shieldActive = false;
  if (p2.shieldActive && !shieldBlocked && loserId !== id2) p2.shieldActive = false;

  state.lastResult = {
    m1, m2, id1, id2, winnerId, tie, damageDealt, shieldBlocked
  };

  state.status = "result";

  helpers.scheduleTimer("state_advance", 5000, () => {
    if (room.currentGameId !== "rockPaperScissors") return;
    
    if (p1.hp <= 0 || p2.hp <= 0) {
      room.gameState.status = "finished";
    } else {
      room.gameState.status = "choosing";
      room.gameState.round += 1;
      room.gameState.lastResult = null;
      p1.selected = null;
      p1.locked = false;
      p2.selected = null;
      p2.locked = false;
    }
  });
}
