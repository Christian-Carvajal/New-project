import { getPlayerName, joinPlayerNames } from "./gameHelpers.js";

export default function MemoryMatchGame({ gameState, me, players, sendAction }) {
  const isMyTurn = gameState.turnPlayerId === me.id;

  return (
    <div className="game-stack">
      <p className="game-description">Flip the shared board in turn order, claim matched pairs, and keep the room watching every reveal.</p>

      <div className="result-banner large">
        <strong>{gameState.turnPlayerId ? `${getPlayerName(players, gameState.turnPlayerId)}'s turn` : "Waiting for players"}</strong>
        <span>
          {gameState.result
            ? `Top pair collectors: ${joinPlayerNames(players, gameState.result.winners)}`
            : gameState.phase === "resolving"
              ? "Mismatch resolving..."
              : "Find a pair to keep your turn."}
        </span>
      </div>

      <div className="memory-board">
        {gameState.cards.map((card) => (
          <button
            className={`memory-card ${card.status}`}
            disabled={!isMyTurn || card.status !== "hidden" || gameState.phase !== "playing"}
            key={card.id}
            onClick={() => sendAction("flip", { index: card.index })}
            type="button"
          >
            {card.value || "?"}
          </button>
        ))}
      </div>

      <div className="status-grid">
        {players.map((player) => (
          <div className={`mini-card ${player.id === gameState.turnPlayerId ? "highlight" : ""}`} key={player.id}>
            <strong>{player.username}</strong>
            <span>{gameState.matchesByPlayer?.[player.id] ?? 0} pairs</span>
          </div>
        ))}
      </div>
    </div>
  );
}
