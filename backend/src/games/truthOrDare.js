import { awardPoints, getConnectedPlayerIds, nextConnectedPlayerId } from "./gameUtils.js";

const SPICE_LEVELS = {
  normal: 1,
  flirty: 2,
  spicy: 3
};

function getWeightedPrompt(pool) {
  if (pool.length === 0) return { text: "No valid prompts found!", weight: 1, spice: "normal" };
  const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight <= 0) return pool[Math.floor(Math.random() * pool.length)]; // Fallback
  
  let r = Math.random() * totalWeight;
  for (let i = 0; i < pool.length; i++) {
    r -= pool[i].weight;
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

export default {
  id: "truthOrDare",
  name: "Truth or Dare: Chaos",
  description: "A fun, highly interactive twist on a classic. Inject chaos and outwit your opponent!",
  category: "Social",
  minPlayers: 2,
  maxPlayers: 8,
  accent: "rose",
  createInitialState() {
    return {
      status: "waiting", // waiting | entry_phase | turn_select | reveal | execute | finished
      round: 1,
      promptsRequired: 3,
      chaosChance: 0.25,
      spiceMode: "normal", // normal, flirty, spicy
      playerStates: {},
      currentTurnId: null,
      turnsThisRound: 0,
      currentResult: null
    };
  },
  serialize({ room, playerId }) {
    const state = room.gameState;
    const secureStates = {};

    for (const [id, pState] of Object.entries(state.playerStates || {})) {
      secureStates[id] = {
        ...pState,
        // Completely hide prompts to prevent scraping cheating
        truths: id === playerId ? pState.truths : "hidden",
        dares: id === playerId ? pState.dares : "hidden",
      };
    }

    return {
      ...state,
      playerStates: secureStates,
      connectedIds: getConnectedPlayerIds(room)
    };
  },
  onAction({ room, playerId, action, helpers }) {
    const state = room.gameState;
    const connectedIds = getConnectedPlayerIds(room);

    if (action.type === "set_spice_mode" && state.status === "waiting") {
      if (["normal", "flirty", "spicy"].includes(action.payload?.mode)) {
        state.spiceMode = action.payload.mode;
      }
      return;
    }

    if (action.type === "start" && state.status === "waiting") {
      helpers.clearTimer("state_advance");
      if (connectedIds.length < 2) return;

      state.status = "entry_phase";
      state.round = 1;
      state.promptsRequired = 3;
      state.chaosChance = 0.25;
      state.turnsThisRound = 0;
      state.currentTurnId = connectedIds[0];
      
      state.playerStates = {};
      connectedIds.forEach(id => {
        state.playerStates[id] = {
          truths: [],
          dares: [],
          locked: false,
          skipAvailable: 1,
          rerollAvailable: 1,
          score: 0
        };
      });
      return;
    }

    const pState = state.playerStates[playerId];
    if (!pState) return;

    if (action.type === "update_prompts" && state.status === "entry_phase" && !pState.locked) {
       const { truths = [], dares = [] } = action.payload;
       
       const sanitize = (list) => list.slice(0, state.promptsRequired).map(p => ({
          text: String(p.text || "I was too lazy to type this!").substring(0, 100),
          weight: Math.max(1, Number(p.weight) || 1),
          spice: SPICE_LEVELS[p.spice] <= SPICE_LEVELS[state.spiceMode] ? p.spice : "normal"
       }));

       pState.truths = sanitize(truths);
       pState.dares = sanitize(dares);
       return;
    }

    if (action.type === "lock_prompts" && state.status === "entry_phase" && !pState.locked) {
       // Validate 100 weight for each pool
       const tWeight = pState.truths.reduce((s, p) => s + p.weight, 0);
       const dWeight = pState.dares.reduce((s, p) => s + p.weight, 0);
       
       if (tWeight === 100 && dWeight === 100 && pState.truths.length === state.promptsRequired && pState.dares.length === state.promptsRequired) {
          pState.locked = true;
          
          if (connectedIds.every(id => state.playerStates[id]?.locked)) {
             state.status = "turn_select";
          }
       }
       return;
    }

    // Turn Actions
    if (action.type === "choose_action" && state.status === "turn_select" && state.currentTurnId === playerId) {
       let { choice, target } = action.payload; // choice: truth/dare, target: self/opponent/random
       if (!["truth", "dare"].includes(choice)) choice = "truth";
       if (!["self", "opponent", "random"].includes(target)) target = "self";

       generateOutcome(room, helpers, playerId, choice, target, connectedIds);
       return;
    }

    // Reaction Window (8 seconds during reveal)
    if (action.type === "use_reroll" && state.status === "reveal") {
       // Allow the active target OR the turn owner to reroll? Let's say turn owner (who controls the fate) or actual target
       const isTarget = isPlayerAmongTargets(state.currentResult.actualTargets, playerId, connectedIds, state.currentTurnId);
       if ((playerId === state.currentTurnId || isTarget) && pState.rerollAvailable > 0) {
          pState.rerollAvailable = 0;
          state.currentResult.rerolled = true;
          helpers.clearTimer("state_advance");
          
          // Generate an un-chaotic reroll (reusing same constraints minus chaos)
          const pool = collectPrompts(room, state.currentResult.finalChoice);
          const newPrompt = getWeightedPrompt(pool);
          state.currentResult.prompt = newPrompt;
          
          // Restart reaction window slightly shorter
          helpers.scheduleTimer("state_advance", 5000, () => {
             room.gameState.status = "execute";
          });
       }
       return;
    }

    if (action.type === "use_skip" && state.status === "reveal") {
       const isTarget = isPlayerAmongTargets(state.currentResult.actualTargets, playerId, connectedIds, state.currentTurnId);
       if (isTarget && pState.skipAvailable > 0 && !state.currentResult.skipped) {
          pState.skipAvailable = 0;
          state.currentResult.skipped = true;
          helpers.clearTimer("state_advance");
          
          state.status = "execute";
       }
       return;
    }

    if (action.type === "complete_turn" && state.status === "execute") {
       // Any involved target or turn owner can press complete
       const isTarget = isPlayerAmongTargets(state.currentResult.actualTargets, playerId, connectedIds, state.currentTurnId);
       if (playerId === state.currentTurnId || isTarget) {
          advanceToNextTurn(room, connectedIds);
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
    } else if (state.status === "entry_phase" && connectedIds.every(id => state.playerStates[id]?.locked)) {
       state.status = "turn_select";
    }
  }
};

function collectPrompts(room, choice) {
   const state = room.gameState;
   const pool = [];
   const maxSpice = SPICE_LEVELS[state.spiceMode];
   
   for (const pState of Object.values(state.playerStates)) {
      const targetList = choice === "truth" ? pState.truths : pState.dares;
      if (Array.isArray(targetList)) {
        pool.push(...targetList.filter(p => SPICE_LEVELS[p.spice] <= maxSpice));
      }
   }
   return pool;
}

function resolveTargetIds(targetType, currentTurnId, connectedIds) {
   if (targetType === "self") return [currentTurnId];
   if (targetType === "random") return [connectedIds[Math.floor(Math.random() * connectedIds.length)]];
   if (targetType === "both" || targetType === "all") return connectedIds;
   if (targetType === "opponent") {
       const others = connectedIds.filter(id => id !== currentTurnId);
       return others.length ? [others[0]] : [currentTurnId];
   }
   return [currentTurnId];
}

function isPlayerAmongTargets(actualTargets, playerId, connectedIds, currentTurnId) {
   const ids = resolveTargetIds(actualTargets, currentTurnId, connectedIds);
   return ids.includes(playerId);
}

function generateOutcome(room, helpers, turnPlayerId, choice, originalTarget, connectedIds) {
    const state = room.gameState;
    let finalChoice = choice;
    let finalTarget = originalTarget;
    let chaos = null;

    // Apply Chaos!
    if (Math.random() < state.chaosChance) {
        const events = ["reverse_target", "both_perform", "upgrade_truth", "random_override", "heart_round"];
        chaos = events[Math.floor(Math.random() * events.length)];

        if (chaos === "reverse_target") {
            finalTarget = originalTarget === "self" ? "opponent" : "self";
        } else if (chaos === "both_perform") {
            finalTarget = "both";
        } else if (chaos === "upgrade_truth" && finalChoice === "truth") {
            finalChoice = "dare";
        } else if (chaos === "random_override") {
            finalTarget = "random";
        }
        // heart_round will just affect styling and maybe force picking flirty if available
    }

    let pool = collectPrompts(room, finalChoice);
    
    // Heart Round overrides prompt to flirty if it exists
    if (chaos === "heart_round") {
       const flirtyPool = pool.filter(p => p.spice === "flirty");
       if (flirtyPool.length > 0) pool = flirtyPool;
    }

    const prompt = getWeightedPrompt(pool);

    state.currentResult = {
       originalChoice: choice,
       originalTarget,
       finalChoice,
       actualTargets: finalTarget,
       chaosEvent: chaos,
       prompt,
       skipped: false,
       rerolled: false
    };

    state.status = "reveal";

    helpers.scheduleTimer("state_advance", 8000, () => {
       if (room.currentGameId !== "truthOrDare") return;
       room.gameState.status = "execute";
    });
}

function advanceToNextTurn(room, connectedIds) {
    const state = room.gameState;
    
    // Reward points to individuals who performed it unless skipped
    if (!state.currentResult.skipped) {
       const targetIds = resolveTargetIds(state.currentResult.actualTargets, state.currentTurnId, connectedIds);
       targetIds.forEach(id => {
          if (state.playerStates[id]) state.playerStates[id].score += 1;
       });
       awardPoints(room, targetIds, 1);
    }
    
    state.turnsThisRound += 1;
    state.currentTurnId = nextConnectedPlayerId(room, state.currentTurnId) ?? connectedIds[0];
    
    // End of round check? Say 2 turns per player
    if (state.turnsThisRound >= connectedIds.length * 2) {
        state.round += 1;
        state.promptsRequired = Math.min(8, state.promptsRequired + 1); // Cap at 8 prompts per category
        state.chaosChance = Math.min(0.60, state.chaosChance + 0.05); // Cap chaos at 60%
        state.turnsThisRound = 0;
        state.status = "entry_phase";
        
        // Reset locks for new entry phase
        connectedIds.forEach(id => {
            if (state.playerStates[id]) state.playerStates[id].locked = false;
        });
    } else {
        state.status = "turn_select";
    }
    
    state.currentResult = null;
}
