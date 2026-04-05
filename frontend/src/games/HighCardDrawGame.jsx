import { formatCardLabel, joinPlayerNames } from "./gameHelpers.js";

function PlayingCard({ card }) {
  if (!card) return null;
  const isHidden = card.hidden || card.id === "hidden";
  return (
    <div className={`playing-card border-slate-300 bg-white text-slate-900 ${isHidden ? "bg-slate-800 text-transparent" : "shadow-md"} rounded-lg p-3 w-16 h-24 flex items-center justify-center font-bold text-center`}>
      {!isHidden && formatCardLabel(card)}
    </div>
  );
}

export default function HighCardDrawGame({ gameState, me, players, sendAction, isHost }) {
  const myCard = gameState.drawnCards?.[me.id];

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-rose-400">High Card Draw</h3>
        <p className="text-sm text-slate-400">Draw a card. Highest rank wins the round!</p>
      </div>

      {gameState.status === "draw" && (
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 text-center">
          <p className="mb-4">Take a card from the deck:</p>
          <div className="flex justify-center relative z-10 w-full mb-3">
             {myCard && !myCard.hidden ? (
                <div className="flex flex-col items-center">
                  <span className="text-sm mb-2 text-rose-400 font-bold">You drew</span>
                  <PlayingCard card={myCard} />
                </div>
             ) : (
                <button 
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 px-12 text-lg rounded-xl transition-colors shadow-lg shadow-rose-500/20"
                  onClick={() => sendAction("draw_card")}
                >
                  Draw Card
                </button>
             )}
          </div>
          <p className="text-sm text-slate-400 mt-4">Waiting for everyone to draw...</p>
        </div>
      )}

      {gameState.status === "result" && (
         <div className="bg-slate-800/80 rounded-2xl p-8 border border-rose-500/50 text-center shadow-lg shadow-rose-500/10">
            <span className="block text-sm font-bold uppercase tracking-widest text-rose-500 mb-2">Round Over</span>
            <p className="text-slate-300 mb-2">
               {gameState.winners?.length > 1 ? "It's a tie!" : "We have a winner!"}
            </p>
            <p className="text-lg font-bold text-white mb-4">
               {gameState.winners?.length > 0 
                  ? `Winners: ${joinPlayerNames(players, gameState.winners)}`
                  : "No winners this round."}
            </p>
         </div>
      )}

      {(gameState.status === "draw" || gameState.status === "result") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {players.map((p) => {
            if (!p.connected) return null;
            const card = gameState.drawnCards?.[p.id];
            const isWinner = gameState.winners?.includes(p.id);
            const isHidden = card?.hidden;

            return (
               <div className={`bg-slate-800/60 rounded-xl p-4 border ${isWinner ? 'border-emerald-500/50 shadow-emerald-500/10 shadow-lg' : 'border-slate-700/50'} flex justify-between items-center`} key={p.id}>
                  <strong>{p.username} {p.id === me.id && "(You)"}</strong>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${isHidden ? "text-slate-400" : "text-rose-400"}`}>
                       {isHidden ? "Card Drawn" : card ? "" : "Waiting..."}
                    </span>
                    {card && <PlayingCard card={card} />}
                  </div>
               </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 mt-2">
        {(gameState.status === "waiting" || gameState.status === "result") && isHost ? (
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-10 rounded-xl transition-colors shadow-lg" onClick={() => sendAction("start")} type="button">
            {gameState.status === "result" ? "Play Again" : "Start Game"}
          </button>
        ) : (gameState.status === "waiting" || gameState.status === "result") && !isHost ? (
          <p className="text-slate-400">Waiting for host to start...</p>
        ) : null}
      </div>
    </div>
  );
}
