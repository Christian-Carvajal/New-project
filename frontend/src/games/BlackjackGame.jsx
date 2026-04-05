import { formatCardLabel, getPlayerName, joinPlayerNames } from "./gameHelpers.js";

function HandCards({ cards }) {
  return (
    <div className="card-row">
      {(cards || []).map((card, idx) => (
        <div className={`playing-card border-slate-300 bg-white text-slate-900 ${card.hidden ? "bg-slate-800 text-transparent" : "shadow-md"} rounded-lg p-3 w-16 h-24 flex items-center justify-center font-bold`} key={card.id || idx}>
          {!card.hidden && formatCardLabel(card)}
        </div>
      ))}
    </div>
  );
}

export default function BlackjackGame({ gameState, me, players, sendAction, isHost }) {
  const isMyTurn = gameState.currentTurnId === me.id;

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-indigo-400">Blackjack Duel</h3>
        <p className="text-sm text-slate-400">Can you beat the dealer without breaking 21?</p>
      </div>

      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 text-center flex flex-col items-center">
        <span className="text-sm font-bold uppercase tracking-widest text-rose-400 mb-2">Dealer</span>
        {gameState.status === "result" && (
          <strong className="text-lg mb-2">Total: {gameState.gameResult?.dealerValue}</strong>
        )}
        <HandCards cards={gameState.dealerHand} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gameState.turnOrder && gameState.turnOrder.map((playerId) => {
          const hand = gameState.playerHands?.[playerId] || [];
          const result = gameState.gameResult?.playerResults?.[playerId];
          const isCurrentTurn = playerId === gameState.currentTurnId;
          const isMe = playerId === me.id;

          let statusText = isCurrentTurn ? "Thinking..." : "Waiting";
          if (gameState.busts?.[playerId]) statusText = "Bust!";
          else if (gameState.standings?.[playerId]) statusText = "Standing";
          if (result) statusText = result.outcome.toUpperCase();

          return (
            <div className={`bg-slate-800/80 rounded-2xl p-5 border ${isCurrentTurn ? "border-indigo-500 shadow-lg shadow-indigo-500/20" : "border-slate-700/50"} flex flex-col items-center relative overflow-hidden`} key={playerId}>
              {isCurrentTurn && <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />}
              
              <div className="flex justify-between w-full mb-3 relative z-10">
                <strong className={`font-bold ${isMe ? "text-indigo-400" : "text-white"}`}>{getPlayerName(players, playerId)} {isMe && "(You)"}</strong>
                <span className={`text-sm font-bold ${result?.outcome === "win" ? "text-emerald-400" : result?.outcome === "bust" || result?.outcome === "lose" ? "text-rose-400" : "text-amber-400"}`}>
                   {statusText}
                </span>
              </div>
              
              <HandCards cards={hand} />
              
              {isMe && isCurrentTurn && gameState.status === "player_turns" && (
                <div className="flex gap-3 mt-4 w-full relative z-10">
                  <button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl transition-colors" disabled={!isMyTurn} onClick={() => sendAction("hit")} type="button">
                    Hit
                  </button>
                  <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-xl transition-colors" disabled={!isMyTurn} onClick={() => sendAction("stand")} type="button">
                    Stand
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-3 mt-2">
        {(gameState.status === "waiting" || gameState.status === "result") && isHost ? (
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg" onClick={() => sendAction("start")} type="button">
            {gameState.status === "result" ? "Deal Again" : "Start Hand"}
          </button>
        ) : (gameState.status === "waiting" || gameState.status === "result") && !isHost ? (
          <p className="text-slate-400">Waiting for host to start...</p>
        ) : null}
      </div>

      {gameState.gameResult && (
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center mt-4">
          <strong className="block text-emerald-400 mb-1">Round Complete</strong>
          <span className="text-slate-300 text-sm">
            {gameState.gameResult.winners.length > 0 
              ? `Winners: ${joinPlayerNames(players, gameState.gameResult.winners)}` 
              : "No winners this round."}
          </span>
        </div>
      )}
    </div>
  );
}
