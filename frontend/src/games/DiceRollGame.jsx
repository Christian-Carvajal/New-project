import { getPlayerName, joinPlayerNames } from "./gameHelpers.js";

export default function DiceRollGame({ gameState, me, players, sendAction, isHost }) {
  const myRoll = gameState.playerRolls?.[me.id];

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-sky-400">Dice Roll Duel</h3>
        <p className="text-sm text-slate-400">Roll a 6-sided die. Highest number wins!</p>
      </div>

      {gameState.status === "rolling" && (
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 text-center">
          <p className="mb-4">It's time to roll:</p>
          <div className="flex justify-center relative z-10 w-full mb-3">
             {myRoll && myRoll !== "hidden" ? (
                <div className="text-3xl font-black text-sky-400 p-4 border-2 border-sky-500/50 rounded-xl bg-slate-900 shadow-xl shadow-sky-500/20">
                  You rolled {myRoll}
                </div>
             ) : (
                <button 
                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 px-12 text-lg rounded-xl transition-colors shadow-lg shadow-sky-500/20"
                  onClick={() => sendAction("roll_dice")}
                >
                  Roll the Dice!
                </button>
             )}
          </div>
          <p className="text-sm text-slate-400 mt-4">Waiting for everyone to roll...</p>
        </div>
      )}

      {gameState.status === "result" && (
         <div className="bg-slate-800/80 rounded-2xl p-8 border border-sky-500/50 text-center shadow-lg shadow-sky-500/10">
            <span className="block text-sm font-bold uppercase tracking-widest text-sky-500 mb-2">Round Over</span>
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

      {(gameState.status === "rolling" || gameState.status === "result") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {players.map((p) => {
            if (!p.connected) return null;
            const roll = gameState.playerRolls?.[p.id];
            const isWinner = gameState.winners?.includes(p.id);

            return (
               <div className={`bg-slate-800/60 rounded-xl p-4 border ${isWinner ? 'border-emerald-500/50 shadow-emerald-500/10 shadow-lg' : 'border-slate-700/50'} flex justify-between items-center`} key={p.id}>
                  <strong>{p.username} {p.id === me.id && "(You)"}</strong>
                  <span className={`text-sm font-bold ${roll === "hidden" ? "text-slate-400" : "text-sky-400"} ${roll && roll !== "hidden" ? "text-xl" : ""}`}>
                     {roll === "hidden" ? "Rolled" : roll ? roll : "Waiting..."}
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
