import { useState } from "react";
import { getPlayerName } from "./gameHelpers.js";

function getHintBadge(hint) {
  if (hint === "too high") return <span className="inline-flex rounded bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-300 border border-rose-500/30">Too High</span>;
  if (hint === "too low") return <span className="inline-flex rounded bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-300 border border-blue-500/30">Too Low</span>;
  if (hint === "correct") return <span className="inline-flex rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">Correct!</span>;
  return null;
}

export default function GuessNumberGame({ gameState, isHost, me, players, sendAction }) {
  const [targetDraft, setTargetDraft] = useState("");
  const [guessDraft, setGuessDraft] = useState("");

  const isPlaying = gameState.activePlayers?.includes(me?.id);
  const amILocked = gameState.locked?.[me?.id];
  const isMyTurn = gameState.turnId === me?.id;
  const opponentId = gameState.activePlayers?.find(id => id !== me?.id);

  function handleJoin() {
    sendAction("join", {});
  }

  function handleLock(e) {
    e.preventDefault();
    if (!targetDraft) return;
    sendAction("lock", { target: Number(targetDraft) });
  }

  function handleGuess(e) {
    e.preventDefault();
    if (!guessDraft) return;
    sendAction("guess", { guess: Number(guessDraft) });
    setGuessDraft("");
  }

  if (gameState.status === "waiting") {
    return (
      <div className="game-stack">
        <p className="game-description text-slate-400">Join the duel. Each player picks a secret number, then race to guess the opponent's number first.</p>
        <div className="flex flex-col items-center gap-4 mt-6">
          <div className="flex gap-2">
            {gameState.activePlayers.map((id) => (
               <span key={id} className="bg-slate-800 border border-slate-700 rounded-full px-4 py-1.5 text-sm font-bold text-white shadow-sm">
                 {getPlayerName(players, id)}
               </span>
            ))}
          </div>
          {gameState.activePlayers.length < 2 && !isPlaying ? (
            <button className="rounded-xl border border-indigo-500/30 bg-indigo-600/20 px-6 py-3 text-sm font-bold text-indigo-300 shadow-lg transition-colors hover:bg-indigo-600/30" onClick={handleJoin} type="button">
              Join Duel
            </button>
          ) : (
            <p className="text-sm font-medium text-slate-400 mt-2">Waiting for opponent...</p>
          )}
        </div>
      </div>
    );
  }

  if (gameState.status === "setup") {
    return (
      <div className="game-stack">
         <div className="text-center mb-6">
            <h3 className="text-xl font-black text-white">Setup Your Secret</h3>
            <p className="text-sm text-slate-400">Pick a number between 1 and {gameState.max}. Your opponent will try to guess it.</p>
         </div>

         {isPlaying ? (
           amILocked ? (
             <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center shadow-inner">
                <span className="text-emerald-400 font-bold block mb-1">Target Locked: {gameState.targets?.[me.id]}</span>
                <span className="text-sm text-emerald-500/70">Waiting for {getPlayerName(players, opponentId)}...</span>
             </div>
           ) : (
             <form onSubmit={handleLock} className="flex flex-col gap-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 w-full max-w-sm mx-auto">
               <label className="flex flex-col gap-2 relative">
                 <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Secret Number</span>
                 <input autoFocus className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-indigo-500 font-mono text-2xl text-center" max={gameState.max} min="1" onChange={(e) => setTargetDraft(e.target.value)} required type="number" value={targetDraft} />
               </label>
               <button className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50" disabled={!targetDraft} type="submit">
                 Lock Number
               </button>
             </form>
           )
         ) : (
            <div className="text-center py-10 text-slate-400 italic">
               Players are setting their secret numbers...
            </div>
         )}
      </div>
    );
  }

  return (
    <div className="game-stack flex flex-col h-full relative">
      <div className="flex justify-between items-center rounded-2xl bg-slate-900 border border-slate-800 p-4 shrink-0 shadow-sm">
        <div className="flex flex-col items-start gap-1">
           <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Player 1</span>
           <span className={`text-sm font-bold ${gameState.turnId === gameState.activePlayers[0] ? "text-indigo-400" : "text-slate-300"}`}>
             {getPlayerName(players, gameState.activePlayers[0])}
           </span>
           {gameState.status === "finished" && (
             <span className="text-xs font-mono bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-white mt-1">Target: {gameState.targets[gameState.activePlayers[0]]}</span>
           )}
        </div>
        <div className="text-center shrink-0 px-4">
           <span className="block text-2xl font-black text-white italic opacity-20">VS</span>
        </div>
        <div className="flex flex-col items-end gap-1">
           <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Player 2</span>
           <span className={`text-sm font-bold ${gameState.turnId === gameState.activePlayers[1] ? "text-indigo-400" : "text-slate-300"}`}>
             {getPlayerName(players, gameState.activePlayers[1])}
           </span>
           {gameState.status === "finished" && (
             <span className="text-xs font-mono bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-white mt-1">Target: {gameState.targets[gameState.activePlayers[1]]}</span>
           )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 pr-2 custom-scrollbar min-h-[150px] flex flex-col gap-2 mt-2">
        {gameState.guesses.map((guess, idx) => (
          <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-800/30 p-2.5 shadow-sm" key={`${guess.playerId}-${guess.timestamp}-${idx}`}>
            <div className="flex items-center gap-3">
              <strong className={`text-sm ${guess.playerId === me?.id ? "text-indigo-300" : "text-slate-300"}`}>
                {getPlayerName(players, guess.playerId)}
              </strong>
              <span className="text-sm font-medium text-slate-400">
                guessed <span className="text-white font-mono">{guess.guess}</span>
              </span>
            </div>
            {getHintBadge(guess.hint)}
          </div>
        ))}
        {gameState.guesses.length === 0 && (
          <div className="m-auto text-sm text-slate-500 font-medium py-10">No guesses yet. First to guess wins!</div>
        )}
      </div>

      {gameState.status === "playing" && isPlaying && (
        <div className="mt-4 shrink-0 border-t border-slate-800 pt-4">
          {isMyTurn ? (
            <form onSubmit={handleGuess} className="flex gap-2">
              <input 
                autoFocus 
                className="flex-1 rounded-xl border border-indigo-500/50 bg-indigo-950/20 px-4 py-3 text-base text-white outline-none focus:border-indigo-400 font-mono" 
                max={gameState.max} 
                min="1" 
                onChange={(e) => setGuessDraft(e.target.value)} 
                placeholder="Enter guess..." 
                required 
                type="number" 
                value={guessDraft} 
              />
              <button 
                className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50" 
                disabled={!guessDraft} 
                type="submit"
              >
                Guess
              </button>
            </form>
          ) : (
            <div className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-center">
               <span className="text-sm font-medium text-slate-400">Waiting for {getPlayerName(players, opponentId)} to guess...</span>
            </div>
          )}
        </div>
      )}

      {gameState.status === "finished" && (
        <div className="mt-4 shrink-0 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center shadow-inner">
           <h3 className="text-xl font-black text-emerald-400 mb-1">
              {gameState.winnerId === me?.id ? "You Won!" : `${getPlayerName(players, gameState.winnerId)} Wins!`}
           </h3>
           <p className="text-sm text-emerald-500/80">They guessed the number correctly.</p>
        </div>
      )}
    </div>
  );
}
