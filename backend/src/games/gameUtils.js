export function clamp(value, minimum, maximum) {
  return Math.min(Math.max(Number(value), minimum), maximum);
}

export function randomInt(minimum, maximum) {
  const min = Math.ceil(minimum);
  const max = Math.floor(maximum);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function pickRandom(items) {
  if (!items.length) {
    return null;
  }

  return items[randomInt(0, items.length - 1)];
}

export function getConnectedPlayers(room) {
  return room.players.filter((player) => player.connected);
}

export function getConnectedPlayerIds(room) {
  return getConnectedPlayers(room).map((player) => player.id);
}

export function getPlayerById(room, playerId) {
  return room.players.find((player) => player.id === playerId) ?? null;
}

export function awardPoints(room, winnerIds, points = 1) {
  const uniqueIds = [...new Set(winnerIds)].filter((playerId) => getPlayerById(room, playerId));

  uniqueIds.forEach((playerId) => {
    room.sessionScores[playerId] ??= 0;
    room.sessionScores[playerId] += points;
  });
}

export function nextConnectedPlayerId(room, currentPlayerId, eligiblePlayerIds) {
  const connectedIds = (eligiblePlayerIds ?? room.players.map((player) => player.id)).filter((playerId) =>
    getPlayerById(room, playerId)?.connected
  );

  if (!connectedIds.length) {
    return null;
  }

  if (!currentPlayerId || !connectedIds.includes(currentPlayerId)) {
    return connectedIds[0];
  }

  const currentIndex = connectedIds.indexOf(currentPlayerId);
  return connectedIds[(currentIndex + 1) % connectedIds.length];
}

export function ensureRuntime(room) {
  room.runtime ??= {
    timers: {},
    disconnectTimers: {},
    cleanupTimer: null
  };

  room.runtime.timers ??= {};
  room.runtime.disconnectTimers ??= {};
  room.runtime.cleanupTimer ??= null;

  return room.runtime;
}

export function clearRoomTimer(room, timerKey) {
  const runtime = ensureRuntime(room);
  const timer = runtime.timers[timerKey];

  if (timer) {
    clearTimeout(timer);
    delete runtime.timers[timerKey];
  }
}

export function clearAllRoomTimers(room) {
  const runtime = ensureRuntime(room);

  Object.keys(runtime.timers).forEach((timerKey) => {
    clearRoomTimer(room, timerKey);
  });
}

export function scheduleRoomTimer(room, timerKey, delay, callback) {
  const runtime = ensureRuntime(room);
  clearRoomTimer(room, timerKey);

  runtime.timers[timerKey] = setTimeout(() => {
    delete runtime.timers[timerKey];
    callback();
  }, delay);
}

const SUITS = ["Spades", "Hearts", "Diamonds", "Clubs"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"];
const HIGH_CARD_VALUES = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  Jack: 11,
  Queen: 12,
  King: 13,
  Ace: 14
};

export function createShuffledDeck() {
  const deck = [];

  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push({
        id: `${rank}-${suit}-${Math.random().toString(36).slice(2, 8)}`,
        rank,
        suit,
        label: `${rank} of ${suit}`
      });
    });
  });

  return shuffle(deck);
}

export function drawCard(deck) {
  return deck.pop() ?? null;
}

export function getBlackjackValue(hand) {
  let total = 0;
  let aces = 0;

  hand.forEach((card) => {
    if (["Jack", "Queen", "King"].includes(card.rank)) {
      total += 10;
      return;
    }

    if (card.rank === "Ace") {
      total += 11;
      aces += 1;
      return;
    }

    total += Number(card.rank);
  });

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

export function getHighCardValue(card) {
  return HIGH_CARD_VALUES[card.rank] ?? 0;
}

export function sanitizeListEntries(entries, fallbackEntries) {
  const filtered = Array.isArray(entries)
    ? entries
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .slice(0, 12)
    : [];

  return filtered.length >= 2 ? filtered : fallbackEntries;
}
