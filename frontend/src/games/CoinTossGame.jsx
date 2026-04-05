import { getPlayerName, joinPlayerNames } from "./gameHelpers.js";

export default function CoinTossGame({ gameState, me, players, sendAction, isHost }) {
  const myChoice = gameState.playerChoices?.[me.id];

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-amber-400">Coin Toss Duel</h3>
        <p className="text-sm text-slate-400">Predict the outcome of the flip to win!</p>
      </div>

      {gameState.status === "choosing" && (
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 text-center">
          <p className="mb-4">Select your side:</p>
          <div className="flex gap-4 justify-center relative z-10 w-full mb-3">
             <button 
                className={`flex-1 py-3 font-bold rounded-xl transition-colors ${myChoice === "Heads" ? "bg-amber-500 text-slate-900" : "bg-slate-700 text-white hover:bg-slate-600"}`}
                onClick={() => sendAction("choose_side", { side: "Heads" })}
             >Heads</button>
             <button 
                className={`flex-1 py-3 font-bold rounded-xl transition-colors ${myChoice === "Tails" ? "bg-amber-500 text-slate-900" : "bg-slate-700 text-white hover:bg-slate-600"}`}
                onClick={() => sendAction("choose_side", { side: "Tails" })}
             >Tails</button>
          </div>
          {isHost && (
             <div className="mt-8 border-t border-slate-700/50 pt-6">
                <p className="text-sm text-slate-400 mb-3">When everyone is ready:</p>
                <button 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg"
                  onClick={() => sendAction("flip_coin")}
                >Flip Coin</button>
             </div>
          )}
        </div>
      )}

      {gameState.status === "result" && (
         <div className="bg-slate-800/80 rounded-2xl p-8 border border-amber-500/50 text-center shadow-lg shadow-amber-500/10">
            <span className="block text-sm font-bold uppercase tracking-widest text-amber-500 mb-2">The coin landed on</span>
            <strong className="block text-4xl mb-4">{gameState.coinResult}</strong>
            <p className="text-slate-300">
               {gameState.winners?.length > 0 
                  ? `Winners: ${joinPlayerNames(players, gameState.winners)}`
                  : "No winners this round."}
            </p>
         </div>
      )}

      {(gameState.status === "choosing" || gameState.status === "result") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {players.map((p) => {
            if (!p.connected) return null;
            const choice = gameState.playerChoices?.[p.id];
            const isWinner = gameState.winners?.includes(p.id);

            return (
               <div className={`bg-slate-800/60 rounded-xl p-4 border ${isWinner ? 'border-emerald-500/50 shadow-emerald-500/10 shadow-lg' : 'border-slate-700/50'} flex justify-between items-center`} key={p.id}>
                  <strong>{p.username} {p.id === me.id && "(You)"}</strong>
                  <span className={`text-sm font-bold ${choice === "hidden" ? "text-slate-400" : "text-amber-400"}`}>
                     {choice === "hidden" ? "Ready" : choice || "Waiting..."}
                  </span>
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
