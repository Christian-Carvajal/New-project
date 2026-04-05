import BlackjackGame from "./BlackjackGame.jsx";
import CoinTossGame from "./CoinTossGame.jsx";
import DiceRollGame from "./DiceRollGame.jsx";
import GuessNumberGame from "./GuessNumberGame.jsx";
import HighCardDrawGame from "./HighCardDrawGame.jsx";
import HigherLowerGame from "./HigherLowerGame.jsx";
import MemoryMatchGame from "./MemoryMatchGame.jsx";
import NumberBattleGame from "./NumberBattleGame.jsx";
import ReactionTimeGame from "./ReactionTimeGame.jsx";
import RockPaperScissorsGame from "./RockPaperScissorsGame.jsx";
import SpinWheelGame from "./SpinWheelGame.jsx";
import TruthOrDareGame from "./TruthOrDareGame.jsx";

export function FallbackGame({ game }) {
  return (
    <div className="result-banner large">
      <strong>{game.name}</strong>
      <span>This game view is not registered yet.</span>
    </div>
  );
}

export const GAME_COMPONENTS = {
  rockPaperScissors: RockPaperScissorsGame,
  coinToss: CoinTossGame,
  diceRoll: DiceRollGame,
  guessNumber: GuessNumberGame,
  higherLower: HigherLowerGame,
  blackjack: BlackjackGame,
  highCardDraw: HighCardDrawGame,
  reactionTime: ReactionTimeGame,
  numberBattle: NumberBattleGame,
  memoryMatch: MemoryMatchGame,
  spinWheel: SpinWheelGame,
  truthOrDare: TruthOrDareGame
};
