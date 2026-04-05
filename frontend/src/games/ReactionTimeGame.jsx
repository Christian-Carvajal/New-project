import { getPlayerName } from "./gameHelpers.js";

export default function ReactionTimeGame({ gameState, players, sendAction }) {
  const falseStartNames = Object.keys(gameState.falseStarts || {}).map((playerId) => getPlayerName(players, playerId));

  return (
    <div className="game-stack">
      <p className="game-description">Wait for the trigger to go live. Clicking early counts as a false start, so timing matters more than hype.</p>

      <div className={`reaction-stage ${gameState.phase}`}>
        <strong>
          {gameState.phase === "idle" && "Ready for the next showdown"}
          {gameState.phase === "arming" && "Wait for green"}
          {gameState.phase === "triggered" && "Go now"}
          {gameState.phase === "finished" && (gameState.winnerId ? `${getPlayerName(players, gameState.winnerId)} wins` : "Round over")}
        </strong>
        <span>
          {gameState.reactionMs
            ? `${gameState.reactionMs} ms`
            : gameState.result?.summary || "When the panel turns live, click faster than everyone else."}
        </span>
      </div>

      <div className="action-row">
        {gameState.phase === "idle" || gameState.phase === "finished" ? (
          <button className="primary-button" onClick={() => sendAction("start")} type="button">
            Start round
          </button>
        ) : null}
        <button className="reaction-button" onClick={() => sendAction("react")} type="button">
          React
        </button>
      </div>

      <div className="status-grid">
        {players.map((player) => (
          <div className="mini-card" key={player.id}>
            <strong>{player.username}</strong>
            <span>{gameState.falseStarts?.[player.id] ? "False start" : "Ready"}</span>
          </div>
        ))}
      </div>

      {falseStartNames.length ? (
        <div className="result-banner">
          <strong>False starts</strong>
          <span>{falseStartNames.join(", ")}</span>
        </div>
      ) : null}
    </div>
  );
}
