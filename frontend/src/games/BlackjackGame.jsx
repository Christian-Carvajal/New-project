import { formatCardLabel, getPlayerName, joinPlayerNames } from "./gameHelpers.js";

function HandCards({ cards }) {
  return (
    <div className="card-row">
      {cards.map((card) => (
        <div className={`playing-card ${card.hidden ? "hidden" : ""}`} key={card.id}>
          {formatCardLabel(card)}
        </div>
      ))}
    </div>
  );
}

export default function BlackjackGame({ gameState, me, players, sendAction }) {
  const isMyTurn = gameState.currentTurnPlayerId === me.id;

  return (
    <div className="game-stack">
      <p className="game-description">Take turns against the dealer, hit or stand on the server clock, and let the room sweat the reveal together.</p>

      <div className="table-layout">
        <div className="table-seat dealer-seat">
          <span className="eyebrow">Dealer</span>
          <strong>Total: {gameState.dealerValue}</strong>
          <HandCards cards={gameState.dealerHand} />
        </div>

        <div className="table-seat">
          <span className="eyebrow">Table state</span>
          <strong>{gameState.phase === "roundOver" ? "Round complete" : gameState.phase}</strong>
          <span>
            {gameState.currentTurnPlayerId ? `${getPlayerName(players, gameState.currentTurnPlayerId)} is up next.` : "Start a new hand."}
          </span>
        </div>
      </div>

      <div className="status-grid">
        {gameState.turnOrder.map((playerId) => {
          const hand = gameState.hands?.[playerId];
          const result = gameState.results?.playerResults?.[playerId];

          return (
            <div className={`mini-card ${playerId === gameState.currentTurnPlayerId ? "highlight" : ""}`} key={playerId}>
              <strong>{getPlayerName(players, playerId)}</strong>
              <span>{hand ? `Value ${hand.value}` : "Spectating"}</span>
              <span>{result ? result.outcome : gameState.busts?.[playerId] ? "Bust" : gameState.standing?.[playerId] ? "Standing" : "Playing"}</span>
              {hand ? <HandCards cards={hand.cards} /> : null}
            </div>
          );
        })}
      </div>

      <div className="action-row">
        {gameState.phase === "ready" || gameState.phase === "roundOver" ? (
          <button className="primary-button" onClick={() => sendAction("start")} type="button">
            {gameState.phase === "roundOver" ? "Deal again" : "Start hand"}
          </button>
        ) : null}
        {gameState.phase === "playerTurns" ? (
          <>
            <button className="primary-button" disabled={!isMyTurn} onClick={() => sendAction("hit")} type="button">
              Hit
            </button>
            <button className="secondary-button" disabled={!isMyTurn} onClick={() => sendAction("stand")} type="button">
              Stand
            </button>
          </>
        ) : null}
      </div>

      {gameState.results ? (
        <div className="result-banner">
          <strong>Dealer finished on {gameState.results.dealerValue}</strong>
          <span>Winners: {joinPlayerNames(players, gameState.results.winners)}</span>
        </div>
      ) : null}
    </div>
  );
}
