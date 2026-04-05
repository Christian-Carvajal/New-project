export function getPlayerName(players, playerId) {
  return players.find((player) => player.id === playerId)?.username ?? "Unknown player";
}

export function joinPlayerNames(players, playerIds) {
  if (!playerIds?.length) {
    return "No winner yet";
  }

  return playerIds.map((playerId) => getPlayerName(players, playerId)).join(", ");
}

export function formatCardLabel(card) {
  if (!card) {
    return "No card";
  }

  if (card.hidden) {
    return "Hidden card";
  }

  return card.label;
}
