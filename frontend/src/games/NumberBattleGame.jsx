import { useEffect, useState } from "react";
import { joinPlayerNames } from "./gameHelpers.js";

export default function NumberBattleGame({ gameState, isHost, me, players, sendAction }) {
  const [maxDraft, setMaxDraft] = useState(gameState.max);
  const [pickDraft, setPickDraft] = useState(String(Math.ceil(gameState.max / 2)));

  useEffect(() => {
    setMaxDraft(gameState.max);
  }, [gameState.max]);

  useEffect(() => {
    setPickDraft(String(gameState.picks?.[me.id] ?? Math.ceil(gameState.max / 2)));
  }, [gameState.max, gameState.picks, me.id]);

  const hasLockedPick = Boolean(gameState.picks?.[me.id]) && !gameState.result;
  const effectivePick = Number(pickDraft || Math.ceil(gameState.max / 2));

  return (
    <div className="game-stack">
      <p className="game-description">Pick your secret number, wait for the random target reveal, and see who landed closest.</p>

      <div className="action-row stacked-mobile">
        <label className="inline-field">
          <span>Range max</span>
          <input disabled={!isHost} min="10" onChange={(event) => setMaxDraft(event.target.value)} type="number" value={maxDraft} />
        </label>
        <button className="ghost-button" disabled={!isHost} onClick={() => sendAction("setMax", { max: Number(maxDraft) })} type="button">
          Update range
        </button>
      </div>

      <div className="action-row stacked-mobile">
        <label className="inline-field wide">
          <span>Your pick</span>
          <input disabled={hasLockedPick} max={gameState.max} min="1" onChange={(event) => setPickDraft(event.target.value)} type="range" value={effectivePick} />
        </label>
        <label className="inline-field">
          <span>Value</span>
          <input disabled={hasLockedPick} max={gameState.max} min="1" onChange={(event) => setPickDraft(event.target.value)} type="number" value={effectivePick} />
        </label>
        <button className="primary-button" disabled={hasLockedPick} onClick={() => sendAction("pick", { value: effectivePick })} type="button">
          {hasLockedPick ? "Pick locked" : "Lock pick"}
        </button>
      </div>

      <div className="status-grid">
        {players.map((player) => (
          <div className="mini-card" key={player.id}>
            <strong>{player.username}</strong>
            <span>{gameState.picks?.[player.id] || "Waiting"}</span>
          </div>
        ))}
      </div>

      <div className="result-banner large">
        <strong>{gameState.result ? `Target: ${gameState.result.target}` : `Pick from 1 to ${gameState.max}`}</strong>
        <span>
          {gameState.result
            ? `Closest players: ${joinPlayerNames(players, gameState.result.winners)}`
            : gameState.picks?.[me.id]
              ? "Your number is locked in."
              : "Nobody else can see your pick until the reveal."}
        </span>
      </div>
    </div>
  );
}
