import React, { useEffect } from 'react';

export default function ReactionTimeGame({ room, isHost, playerId, onAction }) {
  const { gameState, players } = room;
  const { status, round, scores = {}, earlyClickers = [], lastResult } = gameState;

  const isEarly = earlyClickers.includes(playerId);

  const handlePress = () => {
    if (status === 'get_ready' || status === 'go') {
      onAction('click');
    }
  };

  // Allow spacebar for faster/easier desktop interaction
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handlePress();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, isEarly]); // Needs dependency updates so standard checks evaluate right function references

  let bgClass = "bg-slate-900";
  let message = "";
  let subMessage = "";

  if (status === 'waiting') {
    message = "Waiting for host...";
  } else if (status === 'get_ready') {
    bgClass = isEarly ? "bg-slate-900 border-4 border-red-800 text-red-700 opacity-80" : "bg-red-600 hover:bg-red-700 cursor-pointer text-white shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]";
    message = isEarly ? "TOO EARLY!" : "Wait for Green...";
    subMessage = isEarly ? "You are out for this round." : "Get ready to tap!";
  } else if (status === 'go') {
    bgClass = isEarly ? "bg-slate-900 border-4 border-red-800 text-slate-700 opacity-80" : "bg-green-500 hover:bg-green-400 cursor-pointer text-white shadow-[inset_0_0_150px_rgba(0,0,0,0.3)] shadow-[0_0_50px_rgba(34,197,94,0.6)]";
    message = isEarly ? "TOO EARLY!" : "CLICK NOW!!!";
    subMessage = isEarly ? "" : "Quick!";
  } else if (status === 'result') {
    bgClass = "bg-indigo-950";
    if (lastResult?.winner) {
      const isWinner = lastResult.winner === playerId;
      message = isWinner ? `You won!` : `${players[lastResult.winner]?.name} won!`;
      subMessage = `${lastResult.time}ms`;
    } else {
      message = "No clear winner.";
      subMessage = earlyClickers.length > 0 ? "Too many early clicks!" : "";
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border-t border-slate-700 select-none">
      {/* Header */}
      <div className="p-4 bg-slate-800/80 border-b border-slate-700 shrink-0 flex justify-between items-center z-10 shadow-md">
         <div>
           <h2 className="text-xl font-black text-green-400 uppercase tracking-widest">Reaction Time</h2>
           <p className="text-sm text-slate-400 font-bold">Round {round || 1}</p>
         </div>
         {status === 'waiting' && isHost && (
            <button 
              onClick={() => onAction('start')} 
              className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg transition transform active:scale-95 uppercase tracking-wider"
            >
              Start Game
            </button>
         )}
      </div>

      {/* Main Interactive Arena. Use onPointerDown instead of onClick for zero-latency mobile touch detection */}
      <div 
        className={`flex-1 flex flex-col items-center justify-center transition-colors duration-150 relative overflow-hidden ${bgClass}`}
        onPointerDown={handlePress}
      >
         <div className="text-center z-10 px-4">
             <h1 className={`text-4xl md:text-7xl font-black mb-4 tracking-widest uppercase drop-shadow-md ${status === 'go' && !isEarly ? 'animate-bounce' : ''}`}>
                 {message}
             </h1>
             {subMessage && (
                 <p className="text-xl md:text-3xl font-bold opacity-90 drop-shadow">{subMessage}</p>
             )}
         </div>
         
         {(status === 'get_ready' || status === 'go') && !isEarly && (
           <p className="absolute bottom-10 text-white/50 text-sm font-bold tracking-widest uppercase animate-pulse">
               Press Space or Tap Screen
           </p>
         )}
      </div>

      {/* Score Footer */}
      {status !== 'waiting' && (
         <div className="p-3 bg-slate-800/90 border-t border-slate-700 flex gap-4 overflow-x-auto whitespace-nowrap z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
            <span className="text-sm text-slate-400 uppercase tracking-widest font-black py-1.5">Scores:</span>
            {Object.entries(scores).map(([id, score]) => (
               <div key={id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                 id === playerId 
                  ? 'bg-green-900/60 border-green-500/50' 
                  : 'bg-slate-700/50 border-slate-600/50'
               }`}>
                  <span className="text-sm text-slate-200 font-bold">{players[id]?.name || 'Player'}</span>
                  <span className="text-sm font-black text-green-400">{score}</span>
                  {earlyClickers.includes(id) && (status === 'get_ready' || status === 'go' || status === 'result') && (
                    <span className="text-[10px] bg-red-900/80 text-red-300 font-black px-1.5 py-0.5 rounded ml-1 uppercase">Early</span>
                  )}
               </div>
            ))}
         </div>
      )}
    </div>
  );
}
