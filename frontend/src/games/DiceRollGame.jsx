import { useEffect, useState } from "react";
import { joinPlayerNames } from "./gameHelpers.js";

export default function DiceRollGame({ gameState, isHost, me, players, sendAction }) {
  const [sidesDraft, setSidesDraft] = useState(gameState.sides);
  const myRoll = gameState.rolls?.[me.id];

  useEffect(() => {
    setSidesDraft(gameState.sides);
  }, [gameState.sides]);

  return (
    <div className="game-stack">
      <p className="game-description">Choose the dice size, roll once each, and let the highest synchronized result claim the point.</p>

      <div className="action-row">
        <label className="inline-field">
          <span>Sides</span>
          <input
            disabled={!isHost}
            min="4"
            onChange={(event) => setSidesDraft(event.target.value)}
            type="number"
            value={sidesDraft}
          />
        </label>
        <button className="ghost-button" disabled={!isHost} onClick={() => sendAction("setSides", { sides: Number(sidesDraft) })} type="button">
          Update dice
        </button>
        <button className="primary-button" disabled={Boolean(myRoll)} onClick={() => sendAction("roll")} type="button">
          {myRoll ? `Rolled ${myRoll}` : "Roll now"}
        </button>
      </div>

      <div className="status-grid">
        {players.map((player) => (
          <div className="mini-card" key={player.id}>
            <strong>{player.username}</strong>
            <span>{gameState.rolls?.[player.id] ? `Rolled ${gameState.rolls[player.id]}` : "Waiting"}</span>
          </div>
        ))}
      </div>

      {gameState.result ? (
        <div className="result-banner">
          <strong>{gameState.result.summary}</strong>
          <span>Top rollers: {joinPlayerNames(players, gameState.result.winners)}</span>
        </div>
      ) : null}
    </div>
  );
}
