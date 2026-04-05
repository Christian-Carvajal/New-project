import { joinPlayerNames } from "./gameHelpers.js";

export default function HigherLowerGame({ gameState, me, players, sendAction, isHost }) {
  const myPrediction = gameState.playerGuesses?.[me.id];

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-teal-400">Higher or Lower?</h3>
        <p className="text-sm text-slate-400">Predict the next number to score points.</p>
      </div>

      {gameState.status !== "waiting" && (
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 text-center flex flex-col items-center">
            <span className="text-sm font-bold uppercase tracking-widest text-teal-400 mb-2">Current Value</span>
            <strong className="text-6xl font-black mb-2 text-white">{gameState.currentValue}</strong>
        </div>
      )}

      {gameState.status === "choosing" && (
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 text-center">
          <p className="mb-4">Will the next number be higher or lower?</p>
          <div className="flex gap-4 justify-center relative z-10 w-full mb-3">
             <button 
                className={`flex-1 py-3 font-bold rounded-xl transition-colors ${myPrediction === "higher" ? "bg-teal-500 text-slate-900" : "bg-slate-700 text-white hover:bg-slate-600"}`}
                onClick={() => sendAction("guess", { value: "higher" })}
             >Higher &uarr;</button>
             <button 
                className={`flex-1 py-3 font-bold rounded-xl transition-colors ${myPrediction === "lower" ? "bg-teal-500 text-slate-900" : "bg-slate-700 text-white hover:bg-slate-600"}`}
                onClick={() => sendAction("guess", { value: "lower" })}
             >Lower &darr;</button>
          </div>
          <p className="text-sm text-slate-400 mt-4">Waiting for all players to guess...</p>
        </div>
      )}

      {gameState.status === "result" && (
         <div className="bg-slate-800/80 rounded-2xl p-8 border border-teal-500/50 text-center shadow-lg shadow-teal-500/10">
            <span className="block text-sm font-bold uppercase tracking-widest text-teal-500 mb-2">The next value is</span>
            <strong className="block text-5xl mb-4 text-white">{gameState.nextValue}</strong>
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
            const prediction = gameState.playerGuesses?.[p.id];
            const isWinner = gameState.winners?.includes(p.id);

            return (
               <div className={`bg-slate-800/60 rounded-xl p-4 border ${isWinner ? 'border-emerald-500/50 shadow-emerald-500/10 shadow-lg' : 'border-slate-700/50'} flex justify-between items-center`} key={p.id}>
                  <strong>{p.username} {p.id === me.id && "(You)"}</strong>
                  <span className={`text-sm font-bold ${prediction === "hidden" ? "text-slate-400" : "text-teal-400"}`}>
                     {prediction === "hidden" ? "Ready" : prediction || "Waiting..."}
                  </span>
               </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 mt-2">
        {(gameState.status === "waiting" || gameState.status === "result") && isHost ? (
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-10 rounded-xl transition-colors shadow-lg" onClick={() => sendAction("start")} type="button">
            {gameState.status === "result" ? "Next Round" : "Start Game"}
          </button>
        ) : (gameState.status === "waiting" || gameState.status === "result") && !isHost ? (
          <p className="text-slate-400">Waiting for host to {gameState.status === "result" ? "start the next round" : "start"}...</p>
        ) : null}
      </div>
    </div>
  );
}
