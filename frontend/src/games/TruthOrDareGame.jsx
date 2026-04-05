import { getPlayerName } from "./gameHelpers.js";

export default function TruthOrDareGame({ gameState, players, sendAction }) {
  return (
    <div className="game-stack">
      <p className="game-description">Generate a fast truth or dare prompt and keep the room energy up between rounds.</p>

      <div className="choice-grid">
        <button className="choice-button" onClick={() => sendAction("generate", { mode: "truth" })} type="button">
          Truth
        </button>
        <button className="choice-button" onClick={() => sendAction("generate", { mode: "dare" })} type="button">
          Dare
        </button>
        <button className="choice-button" onClick={() => sendAction("generate", { mode: "random" })} type="button">
          Surprise me
        </button>
      </div>

      <div className="result-banner large">
        <strong>{gameState.lastPrompt ? gameState.lastPrompt.type.toUpperCase() : "No prompt yet"}</strong>
        <span>{gameState.lastPrompt ? gameState.lastPrompt.text : "Tap a button to generate the first prompt."}</span>
      </div>

      <div className="feed-list">
        {gameState.history.map((entry) => (
          <div className="feed-row" key={`${entry.timestamp}-${entry.type}`}>
            <strong>{entry.type}</strong>
            <span>
              {entry.text} - {getPlayerName(players, entry.requestedBy)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
