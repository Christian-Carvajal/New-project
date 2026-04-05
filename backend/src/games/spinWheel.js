import { awardPoints, getConnectedPlayerIds } from "./gameUtils.js";

// Helper to pick from a weighted list
function getWeightedResult(wheel) {
  const totalWeight = wheel.reduce((sum, entry) => sum + entry.weight, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < wheel.length; i++) {
    r -= wheel[i].weight;
    if (r <= 0) return { ...wheel[i], index: i };
  }
  return { ...wheel[wheel.length - 1], index: wheel.length - 1 };
}

export default {
  id: "spinWheel",
  name: "Mystery Chaos Wheel",
  description: "Secretly add entries. Spin the wheel to decide your fate. Beware of Chaos!",
  category: "Interactive",
  minPlayers: 1,
  maxPlayers: 4,
  accent: "purple",
  createInitialState() {
    return {
      status: "waiting", // waiting | entry_phase | spin | reveal | execute_result | finished
      round: 1,
      entriesRequired: 3,
      chaosChance: 0.20,
      playerStates: {},
      wheel: [], // Combined locked entries
      currentResult: null, // includes chaosEvent, target, text, etc.
      targetAngle: 0,
      reactionEndTime: 0
    };
  },
  serialize({ room, playerId }) {
    const state = room.gameState;
    const connectedIds = getConnectedPlayerIds(room);
    
    const securePlayerStates = {};
    const showEntries = state.status !== "waiting" && state.status !== "entry_phase";

    for (const [id, pState] of Object.entries(state.playerStates || {})) {
      securePlayerStates[id] = {
        ...pState,
        // Hide entries until the spin starts
        entries: (showEntries || id === playerId) ? pState.entries : []
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
    const connectedIds = getConnectedPlayerIds(room);

    if (action.type === "start" && state.status === "waiting") {
      helpers.clearTimer("state_advance");

      state.status = "entry_phase";
      state.round = 1;
      state.entriesRequired = 3;
      state.chaosChance = 0.20;
      state.wheel = [];
      state.currentResult = null;
      
      state.playerStates = {};
      connectedIds.forEach(id => {
        state.playerStates[id] = {
          entries: [],
          locked: false,
          shieldAvailable: 1,
          rerollAvailable: 1
        };
      });
      return;
    }

    const pState = state.playerStates[playerId];
    if (!pState) return;

    if (action.type === "update_entries" && state.status === "entry_phase" && !pState.locked) {
      if (Array.isArray(action.payload?.entries)) {
         pState.entries = action.payload.entries.slice(0, state.entriesRequired).map(e => ({
           text: String(e.text || "").substring(0, 50),
           weight: Number(e.weight) || 0,
           target: ["self", "opponent", "both", "random"].includes(e.target) ? e.target : "self",
           ownerId: playerId
         }));
      }
      return;
    }

    if (action.type === "lock_entries" && state.status === "entry_phase" && !pState.locked) {
      const totalWeight = pState.entries.reduce((sum, e) => sum + e.weight, 0);
      if (pState.entries.length === state.entriesRequired && totalWeight === 100) {
        pState.locked = true;
        
        const allLocked = connectedIds.every(id => state.playerStates[id]?.locked);
        if (allLocked) {
          startSpin(room, helpers);
        }
      }
      return;
    }

    if (action.type === "use_reroll" && state.status === "reveal") {
      if (pState.rerollAvailable > 0) {
        pState.rerollAvailable = 0;
        helpers.clearTimer("state_advance");
        // Start a fresh spin using the same wheel
        startSpin(room, helpers);
      }
      return;
    }

    if (action.type === "use_shield" && state.status === "reveal") {
      // Shield marks the current result as blocked
      if (pState.shieldAvailable > 0 && !state.currentResult.blocked) {
        pState.shieldAvailable = 0;
        state.currentResult.blockedBy = playerId;
        state.currentResult.blocked = true;
      }
      return;
    }
  },
  onPlayerStatusChanged({ room, helpers }) {
    const state = room.gameState;
    const connectedIds = getConnectedPlayerIds(room);
    
    if (state.status !== "waiting" && connectedIds.length < 1) {
      state.status = "finished";
      helpers.clearTimer("state_advance");
    } else if (state.status === "entry_phase") {
      // Check if remaining players are all locked
      const allLocked = connectedIds.every(id => state.playerStates[id]?.locked);
      if (allLocked && connectedIds.length > 0) {
        startSpin(room, helpers);
      }
    }
  }
};

function startSpin(room, helpers) {
  const state = room.gameState;
  const connectedIds = getConnectedPlayerIds(room);
  
  if (state.status === "entry_phase") {
    // Combine wheel only on the first spin of the round
    state.wheel = [];
    connectedIds.forEach(id => {
      if (state.playerStates[id]?.entries) {
        state.wheel.push(...state.playerStates[id].entries);
      }
    });
  }

  state.status = "spin";
  
  const result = getWeightedResult(state.wheel);
  
  // Calculate Target Angle for wheel visuals
  // Find where this entry sits conceptually on a 360 degree pie
  const totalWeight = state.wheel.reduce((sum, e) => sum + e.weight, 0);
  let priorWeight = 0;
  for (let i = 0; i < result.index; i++) {
     priorWeight += state.wheel[i].weight;
  }
  const sliceSize = result.weight;
  
  const randomInsideSlice = priorWeight + (Math.random() * sliceSize);
  const normalizedAngle = (randomInsideSlice / totalWeight) * 360;
  
  // Add multiple full rotations (e.g. 5 rotations = 1800 deg) and subtract normalized to hit the top spot
  state.targetAngle = (360 * 5) + (360 - normalizedAngle);
  
  // Wait for the CSS spin animation (~5s) to finish before revealing
  helpers.scheduleTimer("state_advance", 5000, () => {
    if (room.currentGameId !== "spinWheel") return;
    
    // Determine Chaos Event
    let chaos = null;
    let actualTarget = result.target;
    
    if (Math.random() < state.chaosChance) {
       const events = ["swap_target", "both_execute", "jackpot"];
       chaos = events[Math.floor(Math.random() * events.length)];
       
       if (chaos === "swap_target") actualTarget = (actualTarget === "self" ? "opponent" : (actualTarget === "opponent" ? "self" : "random"));
       else if (chaos === "both_execute") actualTarget = "both";
       else if (chaos === "jackpot") awardPoints(room, connectedIds, 3); // Immediate payout for jackpot
    }

    state.currentResult = {
      ...result,
      actualTarget,
      chaosEvent: chaos,
      blocked: false,
      blockedBy: null
    };

    state.status = "reveal";
    state.reactionEndTime = Date.now() + 8000;

    helpers.scheduleTimer("state_advance", 8000, () => {
      executeResult(room, helpers);
    });
  });
}

function executeResult(room, helpers) {
  const state = room.gameState;
  state.status = "execute_result";

  // Auto advance to next round after letting them read the execution outcome
  helpers.scheduleTimer("state_advance", 5000, () => {
    if (room.currentGameId !== "spinWheel") return;
    
    const connectedIds = getConnectedPlayerIds(room);
    
    state.status = "entry_phase";
    state.round += 1;
    // Cap at 5 entries max
    state.entriesRequired = Math.min(5, 3 + Math.floor(state.round / 2));
    state.chaosChance = Math.min(0.50, state.chaosChance + 0.05);
    state.currentResult = null;
    state.targetAngle = 0;
    
    connectedIds.forEach(id => {
      if (state.playerStates[id]) {
        state.playerStates[id].entries = [];
        state.playerStates[id].locked = false;
      }
    });
  });
}
