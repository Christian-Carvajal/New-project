import blackjack from "./blackjack.js";
import coinToss from "./coinToss.js";
import diceRoll from "./diceRoll.js";
import guessNumber from "./guessNumber.js";
import highCardDraw from "./highCardDraw.js";
import higherLower from "./higherLower.js";
import memoryMatch from "./memoryMatch.js";
import numberBattle from "./numberBattle.js";
import reactionTime from "./reactionTime.js";
import rockPaperScissors from "./rockPaperScissors.js";
import spinWheel from "./spinWheel.js";
import truthOrDare from "./truthOrDare.js";

const games = [
  rockPaperScissors,
  coinToss,
  diceRoll,
  guessNumber,
  higherLower,
  blackjack,
  highCardDraw,
  reactionTime,
  numberBattle,
  memoryMatch,
  spinWheel,
  truthOrDare
];

const gameMap = new Map(games.map((game) => [game.id, game]));

export const DEFAULT_GAME_ID = "rockPaperScissors";

export const gameCatalog = games.map(({ id, name, description, category, minPlayers, maxPlayers, accent }) => ({
  id,
  name,
  description,
  category,
  minPlayers,
  maxPlayers,
  accent
}));

export function getGameDefinition(gameId) {
  return gameMap.get(gameId) ?? gameMap.get(DEFAULT_GAME_ID);
}

export function createGameState(room, gameId = DEFAULT_GAME_ID) {
  return getGameDefinition(gameId).createInitialState(room);
}

export default games;
