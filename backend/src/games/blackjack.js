import { awardPoints, createShuffledDeck, drawCard, getBlackjackValue, getPlayerById, getConnectedPlayerIds } from "./gameUtils.js";

function getCurrentTurnPlayerId(state) {
  return state.turnOrder[state.currentTurnIndex] ?? null;
}

function findNextTurnIndex(room, state, startingIndex) {
  for (let index = startingIndex; index < state.turnOrder.length; index += 1) {
    const playerId = state.turnOrder[index];
    const player = getPlayerById(room, playerId);

    if (player?.connected && !state.standing[playerId] && !state.busts[playerId]) {
      return index;
    }
  }

  return -1;
}

function finishDealerTurn(room) {
  const state = room.gameState;

  if (state.phase === "roundOver") {
    return;
  }

  state.phase = "dealerTurn";

  while (getBlackjackValue(state.dealerHand) < 17) {
    const card = drawCard(state.deck);

    if (!card) {
      break;
    }

    state.dealerHand.push(card);
  }

  const dealerValue = getBlackjackValue(state.dealerHand);
  const winners = [];
  const playerResults = {};

  state.turnOrder.forEach((playerId) => {
    const hand = state.hands[playerId] ?? [];
    const value = getBlackjackValue(hand);
    let outcome = "lose";

    if (state.busts[playerId]) {
      outcome = "bust";
    } else if (dealerValue > 21 || value > dealerValue) {
      outcome = "win";
      winners.push(playerId);
    } else if (value === dealerValue) {
      outcome = "push";
    }

    playerResults[playerId] = {
      value,
      outcome
    };
  });

  if (winners.length) {
    awardPoints(room, winners, 2);
  }

  state.phase = "roundOver";
  state.results = {
    dealerValue,
    winners,
    playerResults
  };
}

function advanceTurn(room) {
  const state = room.gameState;
  const nextIndex = findNextTurnIndex(room, state, state.currentTurnIndex + 1);

  if (nextIndex === -1) {
    finishDealerTurn(room);
    return;
  }

  state.currentTurnIndex = nextIndex;
}

function startRound(room, nextRound) {
  const playerIds = getConnectedPlayerIds(room);
  const deck = createShuffledDeck();
  const hands = Object.fromEntries(
    playerIds.map((playerId) => [playerId, [drawCard(deck), drawCard(deck)].filter(Boolean)])
  );
  const dealerHand = [drawCard(deck), drawCard(deck)].filter(Boolean);
  const standing = {};
  const busts = {};

  playerIds.forEach((playerId) => {
    standing[playerId] = getBlackjackValue(hands[playerId]) === 21;
    busts[playerId] = false;
  });

  room.gameState = {
    round: nextRound,
    phase: playerIds.length ? "playerTurns" : "ready",
    deck,
    hands,
    dealerHand,
    turnOrder: playerIds,
    currentTurnIndex: 0,
    standing,
    busts,
    results: null
  };

  if (!playerIds.length) {
    return;
  }

  const state = room.gameState;
  const firstPlayableIndex = findNextTurnIndex(room, state, 0);

  if (firstPlayableIndex === -1) {
    finishDealerTurn(room);
    return;
  }

  state.currentTurnIndex = firstPlayableIndex;
}

export default {
  id: "blackjack",
  name: "Blackjack",
  description: "Play a simplified multiplayer hand against the dealer with synchronized turns.",
  category: "Card Games",
  minPlayers: 1,
  maxPlayers: 6,
  accent: "forest",
  createInitialState() {
    return {
      round: 1,
      phase: "ready",
      deck: [],
      hands: {},
      dealerHand: [],
      turnOrder: [],
      currentTurnIndex: 0,
      standing: {},
      busts: {},
      results: null
    };
  },
  onAction({ room, playerId, action }) {
    const state = room.gameState;

    if (action.type === "start" || action.type === "reset") {
      const nextRound = state.phase === "ready" && !state.turnOrder.length ? state.round : state.round + 1;
      startRound(room, nextRound);
      return;
    }

    if (state.phase !== "playerTurns" || getCurrentTurnPlayerId(state) !== playerId) {
      return;
    }

    if (action.type === "hit") {
      const card = drawCard(state.deck);

      if (!card) {
        finishDealerTurn(room);
        return;
      }

      state.hands[playerId].push(card);
      const value = getBlackjackValue(state.hands[playerId]);

      if (value >= 21) {
        state.standing[playerId] = true;
        state.busts[playerId] = value > 21;
        advanceTurn(room);
      }

      return;
    }

    if (action.type === "stand") {
      state.standing[playerId] = true;
      advanceTurn(room);
    }
  },
  onPlayerStatusChanged({ room, playerId }) {
    const state = room.gameState;

    if (state.phase !== "playerTurns") {
      return;
    }

    if (!state.turnOrder.includes(playerId)) {
      return;
    }

    if (getCurrentTurnPlayerId(state) === playerId && !getPlayerById(room, playerId)?.connected) {
      state.standing[playerId] = true;
      advanceTurn(room);
      return;
    }

    const currentTurnPlayerId = getCurrentTurnPlayerId(state);

    if (currentTurnPlayerId && !getPlayerById(room, currentTurnPlayerId)?.connected) {
      state.standing[currentTurnPlayerId] = true;
      advanceTurn(room);
    }
  },
  serialize({ room }) {
    const state = room.gameState;
    const revealDealer = state.phase === "dealerTurn" || state.phase === "roundOver";
    const dealerPreview =
      revealDealer || state.dealerHand.length < 2
        ? state.dealerHand
        : [
            state.dealerHand[0],
            {
              id: "hidden-card",
              label: "Hidden card",
              hidden: true
            }
          ];

    return {
      ...state,
      currentTurnPlayerId: state.phase === "playerTurns" ? getCurrentTurnPlayerId(state) : null,
      dealerHand: dealerPreview,
      hands: Object.fromEntries(
        Object.entries(state.hands).map(([playerId, hand]) => [
          playerId,
          {
            cards: hand,
            value: getBlackjackValue(hand)
          }
        ])
      ),
      dealerValue: revealDealer ? getBlackjackValue(state.dealerHand) : getBlackjackValue(state.dealerHand.slice(0, 1))
    };
  }
};
