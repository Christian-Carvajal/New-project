import { awardPoints, createShuffledDeck, drawCard, getBlackjackValue, getConnectedPlayerIds } from "./gameUtils.js";

function advanceTurn(room) {
  const state = room.gameState;
  const currentIndex = state.turnOrder.indexOf(state.currentTurnId);
  const nextPlayers = state.turnOrder.slice(currentIndex + 1);
  const nextPlayerId = nextPlayers.find((id) => !state.standings[id] && !state.busts[id]);

  if (nextPlayerId) {
    state.currentTurnId = nextPlayerId;
  } else {
    state.status = "dealer_turn";
    state.currentTurnId = null;
    playDealerTurn(room);
  }
}

function playDealerTurn(room) {
  const state = room.gameState;
  
  while (getBlackjackValue(state.dealerHand) < 17) {
    const card = drawCard(state.deck);
    if (!card) break;
    state.dealerHand.push(card);
  }

  evaluateGame(room);
}

function evaluateGame(room) {
  const state = room.gameState;
  state.status = "result";
  
  const dealerValue = getBlackjackValue(state.dealerHand);
  const isDealerBust = dealerValue > 21;
  const winners = [];
  const playerResults = {};

  state.turnOrder.forEach((pId) => {
    const value = getBlackjackValue(state.playerHands[pId]);
    let outcome = "lose";

    if (state.busts[pId]) {
      outcome = "bust";
    } else if (isDealerBust || value > dealerValue) {
      outcome = "win";
      winners.push(pId);
    } else if (value === dealerValue) {
      outcome = "push";
    }

    playerResults[pId] = { value, outcome };
  });

  if (winners.length) {
    awardPoints(room, winners, 2);
  }

  state.gameResult = { dealerValue, winners, playerResults };
}

export default {
  id: "blackjack",
  name: "Blackjack",
  description: "A competitive multiplayer Blackjack duel against the dealer.",
  category: "Card Games",
  minPlayers: 1,
  maxPlayers: 6,
  accent: "forest",
  createInitialState() {
    return {
      status: "waiting", // waiting | dealing | player_turns | dealer_turn | result
      deck: [],
      playerHands: {},
      dealerHand: [],
      turnOrder: [],
      currentTurnId: null,
      standings: {},
      busts: {},
      gameResult: null
    };
  },
  serialize({ room }) {
    const state = room.gameState;
    const isReveal = state.status === "dealer_turn" || state.status === "result";
    return {
      ...state,
      deck: undefined,
      dealerHand: (!isReveal && state.dealerHand.length > 1) 
        ? [state.dealerHand[0], { id: "hidden_hole_card", hidden: true }] 
        : state.dealerHand
    };
  },
  onAction({ room, playerId, action }) {
    const state = room.gameState;

    if (action.type === "start" || action.type === "reset") {
      const playerIds = getConnectedPlayerIds(room);
      if (playerIds.length === 0) return;

      const deck = createShuffledDeck();
      const playerHands = {};
      const standings = {};
      const busts = {};

      playerIds.forEach((id) => {
        playerHands[id] = [drawCard(deck), drawCard(deck)];
        standings[id] = getBlackjackValue(playerHands[id]) === 21;
        busts[id] = false;
      });

      state.status = "player_turns";
      state.deck = deck;
      state.playerHands = playerHands;
      state.dealerHand = [drawCard(deck), drawCard(deck)];
      state.turnOrder = playerIds;
      state.standings = standings;
      state.busts = busts;
      state.gameResult = null;

      const firstActive = playerIds.find((id) => !standings[id] && !busts[id]);
      if (firstActive) {
        state.currentTurnId = firstActive;
      } else {
        state.status = "dealer_turn";
        state.currentTurnId = null;
        playDealerTurn(room);
      }
      return;
    }

    if (state.status !== "player_turns" || state.currentTurnId !== playerId) {
      return;
    }

    if (action.type === "hit") {
      const card = drawCard(state.deck);
      if (!card) return;

      state.playerHands[playerId].push(card);
      const value = getBlackjackValue(state.playerHands[playerId]);

      if (value > 21) {
        state.standings[playerId] = true;
        state.busts[playerId] = true;
        advanceTurn(room);
      } else if (value === 21) {
        state.standings[playerId] = true;
        advanceTurn(room);
      }
      return;
    }

    if (action.type === "stand") {
      state.standings[playerId] = true;
      advanceTurn(room);
    }
  }
};
