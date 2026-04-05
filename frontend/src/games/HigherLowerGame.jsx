import { joinPlayerNames } from "./gameHelpers.js";

export default function HigherLowerGame({ gameState, me, players, sendAction }) {
  const myPrediction = gameState.predictions?.[me.id];

  return (
    <div className="game-stack">
      <p className="game-description">Look at the current value, make your call, and wait for the next reveal to settle the room.</p>

      <div className="result-banner large">
        <strong>Current value: {gameState.currentValue}</strong>
        <span>{gameState.result ? gameState.result.summary : "Predict whether the next reveal goes up or down."}</span>
      </div>

      <div className="choice-grid">
        <button
          className={`choice-button ${myPrediction === "higher" ? "active" : ""}`}
          disabled={Boolean(myPrediction) || Boolean(gameState.result)}
          onClick={() => sendAction("predict", { value: "higher" })}
          type="button"
        >
          Higher
        </button>
        <button
          className={`choice-button ${myPrediction === "lower" ? "active" : ""}`}
          disabled={Boolean(myPrediction) || Boolean(gameState.result)}
          onClick={() => sendAction("predict", { value: "lower" })}
          type="button"
        >
          Lower
        </button>
      </div>

      <div className="status-grid">
        {players.map((player) => (
          <div className="mini-card" key={player.id}>
            <strong>{player.username}</strong>
            <span>{gameState.predictions?.[player.id] || "Waiting"}</span>
          </div>
        ))}
      </div>

      {gameState.result ? (
        <div className="result-banner">
          <strong>Next reveal: {gameState.result.nextValue}</strong>
          <span>Round winners: {joinPlayerNames(players, gameState.result.winners)}</span>
          <button className="secondary-button" onClick={() => sendAction("nextRound")} type="button">
            Next round
          </button>
        </div>
      ) : null}
    </div>
  );
}
