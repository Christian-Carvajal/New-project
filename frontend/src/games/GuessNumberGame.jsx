import { useEffect, useState } from "react";
import { getPlayerName } from "./gameHelpers.js";

export default function GuessNumberGame({ gameState, isHost, players, sendAction }) {
  const [maxDraft, setMaxDraft] = useState(gameState.max);
  const [targetDraft, setTargetDraft] = useState(gameState.target || "");
  const [guessDraft, setGuessDraft] = useState("");

  useEffect(() => {
    setMaxDraft(gameState.max);
    setTargetDraft(gameState.target || "");
  }, [gameState.max, gameState.target]);

  useEffect(() => {
    setGuessDraft("");
  }, [gameState.round, gameState.status, gameState.winnerId]);

  const hasGuessReady = guessDraft !== "";

  return (
    <div className="game-stack">
      <p className="game-description">Use a system-random target or let the host quietly set the number, then guide the room with higher and lower hints.</p>

      {isHost ? (
        <div className="action-row stacked-mobile">
          <label className="inline-field">
            <span>Max</span>
            <input min="10" onChange={(event) => setMaxDraft(event.target.value)} type="number" value={maxDraft} />
          </label>
          <button className="ghost-button" onClick={() => sendAction("configure", { mode: "system", max: Number(maxDraft) })} type="button">
            Start random round
          </button>
          <label className="inline-field">
            <span>Secret target</span>
            <input min="1" onChange={(event) => setTargetDraft(event.target.value)} type="number" value={targetDraft} />
          </label>
          <button
            className="ghost-button"
            onClick={() => sendAction("configure", { mode: "host", max: Number(maxDraft), target: Number(targetDraft) })}
            type="button"
          >
            Start host round
          </button>
          {gameState.mode === "host" && gameState.status === "awaitingTarget" ? (
            <button className="secondary-button" onClick={() => sendAction("setTarget", { target: Number(targetDraft) })} type="button">
              Lock target
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="result-banner large">
        <strong>
          {gameState.status === "finished"
            ? `Target was ${gameState.target}`
            : gameState.mode === "host"
              ? "Host-set round"
              : `Random round between 1 and ${gameState.max}`}
        </strong>
        <span>
          {gameState.winnerId ? `${getPlayerName(players, gameState.winnerId)} guessed it first.` : "Keep guessing while the hints stay hot."}
        </span>
      </div>

      {gameState.canGuess && gameState.status === "active" ? (
        <div className="action-row">
          <label className="inline-field">
            <span>Your guess</span>
            <input min="1" onChange={(event) => setGuessDraft(event.target.value)} type="number" value={guessDraft} />
          </label>
          <button className="primary-button" disabled={!hasGuessReady} onClick={() => sendAction("guess", { guess: Number(guessDraft) })} type="button">
            Submit guess
          </button>
          {gameState.yourHint ? <span className="helper-copy">{gameState.yourHint}</span> : null}
        </div>
      ) : null}

      <div className="feed-list">
        {gameState.guesses.map((guess) => (
          <div className="feed-row" key={`${guess.playerId}-${guess.timestamp}`}>
            <strong>{getPlayerName(players, guess.playerId)}</strong>
            <span>
              guessed {guess.guess} - {guess.hint}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
