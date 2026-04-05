import { joinPlayerNames } from "./gameHelpers.js";

const MOVES = ["rock", "paper", "scissors"];

export default function RockPaperScissorsGame({ gameState, me, players, sendAction }) {
  const myChoice = gameState.choices?.[me.id];

  return (
    <div className="game-stack">
      <p className="game-description">Lock your move and wait for the rest of the room. The server reveals every pick together.</p>

      <div className="choice-grid">
        {MOVES.map((move) => (
          <button
            className={`choice-button ${myChoice === move ? "active" : ""}`}
            disabled={Boolean(myChoice) || gameState.phase === "result"}
            key={move}
            onClick={() => sendAction("choose", { move })}
            type="button"
          >
            {move}
          </button>
        ))}
      </div>

      <div className="status-grid">
        {players.map((player) => (
          <div className="mini-card" key={player.id}>
            <strong>{player.username}</strong>
            <span>{gameState.choices?.[player.id] || "Waiting"}</span>
          </div>
        ))}
      </div>

      {gameState.result ? (
        <div className="result-banner">
          <strong>{gameState.result.summary}</strong>
          <span>Round winners: {joinPlayerNames(players, gameState.result.winners)}</span>
        </div>
      ) : null}
    </div>
  );
}
