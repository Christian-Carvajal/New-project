import { awardPoints, getConnectedPlayerIds } from "./gameUtils.js";

const MOVES = ["rock", "paper", "scissors"];

function getWinningMove(firstMove, secondMove) {
  if (
    (firstMove === "rock" && secondMove === "scissors") ||
    (firstMove === "paper" && secondMove === "rock") ||
    (firstMove === "scissors" && secondMove === "paper")
  ) {
    return firstMove;
  }

  return secondMove;
}

function resolveRound(room) {
  const state = room.gameState;
  const activeIds = getConnectedPlayerIds(room);

  if (activeIds.length < 2 || !activeIds.every((playerId) => state.choices[playerId])) {
    return;
  }

  const uniqueMoves = [...new Set(activeIds.map((playerId) => state.choices[playerId]))];
  let winners = [];
  let summary = "It's a draw.";

  if (uniqueMoves.length === 2) {
    const winningMove = getWinningMove(uniqueMoves[0], uniqueMoves[1]);
    winners = activeIds.filter((playerId) => state.choices[playerId] === winningMove);
    summary = winners.length > 1 ? `${winningMove} takes the round.` : `${winningMove} wins the round.`;
  }

  if (winners.length) {
    awardPoints(room, winners, 1);
  }

  state.phase = "result";
  state.result = {
    winners,
    summary,
    revealedChoices: { ...state.choices }
  };
}

export default {
  id: "rockPaperScissors",
  name: "Rock Paper Scissors",
  description: "Everyone locks in a move and the server resolves the round together.",
  category: "Simple RNG",
  minPlayers: 2,
  maxPlayers: 8,
  accent: "sunburst",
  createInitialState() {
    return {
      round: 1,
      phase: "waiting",
      choices: {},
      result: null
    };
  },
  onAction({ room, playerId, action }) {
    const state = room.gameState;

    if (action.type === "choose" && MOVES.includes(action.payload?.move) && state.phase !== "result") {
      state.choices[playerId] = action.payload.move;
      resolveRound(room);
    }

    if (action.type === "reset") {
      room.gameState = {
        round: state.round + 1,
        phase: "waiting",
        choices: {},
        result: null
      };
    }
  },
  onPlayerStatusChanged({ room }) {
    if (room.gameState.phase !== "result") {
      resolveRound(room);
    }
  },
  serialize({ room, playerId }) {
    const state = room.gameState;
    const revealChoices = state.phase === "result";

    return {
      ...state,
      choices: Object.fromEntries(
        room.players.map((player) => [
          player.id,
          revealChoices || player.id === playerId
            ? state.choices[player.id] ?? null
            : state.choices[player.id]
              ? "locked"
              : null
        ])
      )
    };
  }
};
