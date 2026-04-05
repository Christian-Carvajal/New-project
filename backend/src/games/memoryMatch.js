import { awardPoints, getConnectedPlayerIds, nextConnectedPlayerId, shuffle } from "./gameUtils.js";

// A variety of symbols for dynamic board generation
const MEMORY_ICONS = ["??", "??", "??", "??", "?", "??", "?", "??", "??", "??", "???", "??", "??", "?", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??"];

function createDynamicBoard(pairCount) {
  const selectedIcons = shuffle([...MEMORY_ICONS]).slice(0, pairCount);
  
  const deck = selectedIcons.flatMap((value, index) => [
    {
      id: `${index}-A-${Math.random().toString(36).substring(7)}`,
      value,
      matched: false
    },
    {
      id: `${index}-B-${Math.random().toString(36).substring(7)}`,
      value,
      matched: false
    }
  ]);
  
  return shuffle(deck);
}

export default {
  id: "memoryMatch",
  name: "Memory Match",
  description: "Take turns flipping cards. Find pairs to keep your turn and score points!",
  category: "Interactive",
  minPlayers: 1,
  maxPlayers: 8,
  accent: "aurora",
  createInitialState() {
    return {
      status: "waiting", // waiting | playing | finished
      round: 1,
      pairCount: 4, // Starts with 4 pairs (8 cards), can grow if wanted
      board: [],
      flippedIndices: [],
      turnPlayerId: null,
      scoresByPlayer: {},
      winners: []
    };
  },
  serialize({ room, playerId }) {
    const state = room.gameState;
    
    // Anti-cheat: Send front values only if flipped or matched
    const secureBoard = state.board.map((card, index) => {
      const isFlipped = state.flippedIndices.includes(index);
      const isVisible = card.matched || isFlipped;
      
      return {
        id: card.id,
        matched: card.matched,
        isFlipped,
        value: isVisible ? card.value : null
      };
    });

    return {
      ...state,
      board: secureBoard
    };
  },
  onAction({ room, playerId, action, helpers }) {
    const state = room.gameState;

    if (action.type === "start" || action.type === "reset") {
      helpers.clearTimer("mismatch_delay");
      helpers.clearTimer("next_round_auto");

      const connectedIds = getConnectedPlayerIds(room);
      if (connectedIds.length === 0) return;

      state.status = "playing";
      state.round = action.type === "reset" ? 1 : state.round;
      
      // Gradually increase difficulty depending on round
      state.pairCount = Math.min(4 + Math.floor((state.round - 1) / 2), 12); 
      
      state.board = createDynamicBoard(state.pairCount);
      state.flippedIndices = [];
      state.turnPlayerId = connectedIds[0];
      
      // Initialize scores if absent
      if (action.type === "reset") {
         state.scoresByPlayer = Object.fromEntries(connectedIds.map((id) => [id, 0]));
      }

      state.winners = [];
      return;
    }

    if (state.status !== "playing" || state.turnPlayerId !== playerId) {
      return;
    }

    if (action.type === "flip_card") {
      const index = Number(action.payload?.index);
      
      // Prevent flipping if 2 cards already flipped (waiting for mismatch timeout)
      if (state.flippedIndices.length >= 2) return;
      
      // Validate index and ensure card isn't already matched or flipped
      const card = state.board[index];
      if (!card || card.matched || state.flippedIndices.includes(index)) return;

      state.flippedIndices.push(index);

      if (state.flippedIndices.length === 2) {
        const [idx1, idx2] = state.flippedIndices;
        const card1 = state.board[idx1];
        const card2 = state.board[idx2];

        if (card1.value === card2.value) {
          // Match!
          card1.matched = true;
          card2.matched = true;
          
          state.scoresByPlayer[playerId] = (state.scoresByPlayer[playerId] || 0) + 1;
          state.flippedIndices = [];
          
          awardPoints(room, [playerId], 1);

          // Check if game over
          if (state.board.every(c => c.matched)) {
             state.status = "finished";
             
             // Determine winner
             const highestScore = Math.max(...Object.values(state.scoresByPlayer));
             state.winners = Object.entries(state.scoresByPlayer)
                .filter(([_, score]) => score === highestScore && score > 0)
                .map(([id, _]) => id);

             // Auto restart after 4 seconds
             helpers.scheduleTimer("next_round_auto", 4000, () => {
               if (room.currentGameId !== "memoryMatch") return;
               room.gameState.round += 1;
               
               // Keep same scores, just new board
               room.gameState.status = "playing";
               room.gameState.pairCount = Math.min(4 + Math.floor((room.gameState.round - 1) / 2), 12);
               room.gameState.board = createDynamicBoard(room.gameState.pairCount);
               room.gameState.flippedIndices = [];
               
               const activeIds = getConnectedPlayerIds(room);
               if(activeIds.length > 0) {
                 room.gameState.turnPlayerId = nextConnectedPlayerId(room, room.gameState.turnPlayerId) ?? activeIds[0];
               }
             });
          }
        } else {
          // No match, clear after delay and switch turns
          helpers.scheduleTimer("mismatch_delay", 1500, () => {
             if (room.currentGameId !== "memoryMatch") return;
             
             room.gameState.flippedIndices = [];
             
             const activeIds = getConnectedPlayerIds(room);
             if(activeIds.length > 0) {
                room.gameState.turnPlayerId = nextConnectedPlayerId(room, playerId) ?? activeIds[0];
             }
          });
        }
      }
    }
  },
  onPlayerStatusChanged({ room }) {
    const state = room.gameState;
    const connectedIds = getConnectedPlayerIds(room);
    
    connectedIds.forEach((id) => {
        state.scoresByPlayer[id] ??= 0;
    });

    if (state.status === "playing" && !connectedIds.includes(state.turnPlayerId)) {
        state.turnPlayerId = connectedIds[0] || null;
    }
  }
};
