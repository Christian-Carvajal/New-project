import { useEffect, useState } from "react";
import { getPlayerName } from "./gameHelpers.js";

export default function SpinWheelGame({ gameState, isHost, players, sendAction }) {
  const entriesSignature = gameState.entries.join("\n");
  const [entriesDraft, setEntriesDraft] = useState(entriesSignature);

  useEffect(() => {
    setEntriesDraft(entriesSignature);
  }, [entriesSignature]);

  return (
    <div className="game-stack">
      <p className="game-description">Customize the wheel, spin once, and let the whole room land on the same shared result.</p>

      <div className="wheel-preview">
        <div className={`wheel-core ${gameState.spinning ? "spinning" : ""}`}>
          <strong>{gameState.result || "Spin me"}</strong>
        </div>
      </div>

      {isHost ? (
        <label className="field">
          <span>Wheel entries</span>
          <textarea
            onChange={(event) => setEntriesDraft(event.target.value)}
            placeholder="One choice per line"
            rows="6"
            value={entriesDraft}
          />
        </label>
      ) : null}

      <div className="action-row">
        {isHost ? (
          <button
            className="ghost-button"
            onClick={() =>
              sendAction("setEntries", {
                entries: entriesDraft
                  .split("\n")
                  .map((entry) => entry.trim())
                  .filter(Boolean)
              })
            }
            type="button"
          >
            Save entries
          </button>
        ) : null}
        <button className="primary-button" disabled={gameState.spinning} onClick={() => sendAction("spin")} type="button">
          {gameState.spinning ? "Spinning..." : "Spin the wheel"}
        </button>
      </div>

      <div className="status-grid">
        {gameState.entries.map((entry) => (
          <div className="mini-card" key={entry}>
            <strong>{entry}</strong>
            <span>Wheel entry</span>
          </div>
        ))}
      </div>

      {gameState.result ? (
        <div className="result-banner">
          <strong>{gameState.result}</strong>
          <span>{gameState.spunBy ? `Spun by ${getPlayerName(players, gameState.spunBy)}` : "Ready for another spin"}</span>
        </div>
      ) : null}
    </div>
  );
}
