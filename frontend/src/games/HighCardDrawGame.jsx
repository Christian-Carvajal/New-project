import { formatCardLabel, joinPlayerNames } from "./gameHelpers.js";

export default function HighCardDrawGame({ gameState, me, players, sendAction }) {
  return (
    <div className="game-stack">
      <p className="game-description">Draw once from the same deck and let the highest rank take the point for the round.</p>

      <div className="action-row">
        <button className="primary-button" disabled={Boolean(gameState.draws?.[me.id]) && !gameState.result} onClick={() => sendAction("draw")} type="button">
          {gameState.draws?.[me.id] ? "Card locked in" : "Draw card"}
        </button>
      </div>

      <div className="status-grid">
        {players.map((player) => (
          <div className="mini-card" key={player.id}>
            <strong>{player.username}</strong>
            <span>{gameState.draws?.[player.id] ? formatCardLabel(gameState.draws[player.id]) : "Waiting"}</span>
          </div>
        ))}
      </div>

      {gameState.result ? (
        <div className="result-banner">
          <strong>High card settled</strong>
          <span>Round winners: {joinPlayerNames(players, gameState.result.winners)}</span>
        </div>
      ) : null}
    </div>
  );
}
