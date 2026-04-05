import { getPlayerName } from "./gameHelpers.js";

export default function CoinTossGame({ gameState, players, sendAction }) {
  return (
    <div className="game-stack">
      <p className="game-description">Flip a shared coin and let the room watch the same outcome land at once.</p>

      <div className="action-row">
        <button className="primary-button" onClick={() => sendAction("flip")} type="button">
          Flip the coin
        </button>
      </div>

      <div className="result-banner large">
        <strong>{gameState.lastResult ? gameState.lastResult.side : "Heads or tails?"}</strong>
        <span>
          {gameState.lastResult ? `Flipped by ${getPlayerName(players, gameState.lastResult.flippedBy)}` : "No flips yet this session."}
        </span>
      </div>

      <div className="status-grid">
        {gameState.history.map((entry) => (
          <div className="mini-card" key={`${entry.timestamp}-${entry.side}`}>
            <strong>{entry.side}</strong>
            <span>{getPlayerName(players, entry.flippedBy)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
