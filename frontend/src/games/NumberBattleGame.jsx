import React from 'react';

export default function NumberBattleGame({ room, isHost, me, sendAction }) {
  const playerId = me?.id;
  const onAction = sendAction;
  const { gameState, players } = room;
  const { status, round, playerStates = {}, lastRoundResult, connectedIds = [] } = gameState;

  const opponentIds = connectedIds.filter(id => id !== playerId);
  const myState = playerStates[playerId] || {};
  const isMyTurn = status === 'playing' && !myState.locked;

  const handleChoose = (num) => {
    if (isMyTurn) onAction('choose_number', { number: num });
  };

  const handleLock = () => {
    if (isMyTurn && myState.selected !== null) onAction('lock');
  };

  const renderNumberCard = (num, available, selected) => {
    let classes = "w-10 h-14 sm:w-14 sm:h-20 rounded-lg font-bold text-lg sm:text-2xl transition-all transform flex items-center justify-center border-2 shrink-0 ";
    
    if (!available.includes(num)) {
      classes += "bg-slate-800 border-slate-700 text-slate-600 opacity-50 cursor-not-allowed";
    } else if (selected === num) {
      classes += "bg-red-600 border-red-400 text-white scale-110 shadow-lg shadow-red-600/50 -translate-y-2";
    } else if (isMyTurn) {
      classes += "bg-slate-700 border-slate-500 text-white hover:bg-slate-600 hover:-translate-y-1 cursor-pointer";
    } else {
      classes += "bg-slate-700 border-slate-500 text-slate-300 cursor-not-allowed";
    }

    return (
      <button
        key={num}
        onClick={() => handleChoose(num)}
        disabled={!isMyTurn || !available.includes(num)}
        className={classes}
      >
        {num}
      </button>
    );
  };

  const renderResultArena = () => {
    if (status !== 'result' || !lastRoundResult) return null;

    return (
      <div className="flex flex-col items-center justify-center space-y-4 animate-fade-in my-8">
        <div className="flex flex-col items-center text-center space-y-2">
           {lastRoundResult.tie ? (
             <h3 className="text-3xl font-black text-slate-400 uppercase tracking-widest">Tie!</h3>
           ) : lastRoundResult.critical ? (
             <h3 className="text-3xl font-black text-yellow-400 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">CRITICAL HIT!</h3>
           ) : (
             <h3 className="text-3xl font-black text-green-400 uppercase tracking-widest">Winner!</h3>
           )}

           <p className="text-slate-300 max-w-md text-sm sm:text-base">
             {lastRoundResult.tie && "Numbers nullified. Streaks reset."}
             {lastRoundResult.critical && "The 1 outsmarted the opponent's highest string!"}
           </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 pb-4">
          {connectedIds.map((id) => {
            const playedNum = lastRoundResult.plays[id];
            const isWinner = lastRoundResult.winners.includes(id);
            const pointsAw = lastRoundResult.pointsAwarded[id] || 0;
            return (
              <div key={id} className="flex flex-col items-center gap-2">
                 <span className="text-sm font-bold text-slate-400">{players[id]?.name}</span>
                 <div className={`w-20 h-28 sm:w-24 sm:h-32 flex items-center justify-center rounded-xl text-4xl font-black border-4 ${
                   isWinner ? 'bg-red-600 border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.8)] scale-110' : 'bg-slate-700 border-slate-600 opacity-50'
                 }`}>
                    {playedNum}
                 </div>
                 {isWinner && <span className="text-green-400 font-bold text-lg">+{pointsAw} pts</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-t border-slate-700">
      {/* Header */}
      <div className="p-4 bg-slate-800 border-b border-slate-700 shrink-0 flex justify-between items-center">
         <div>
           <h2 className="text-xl font-bold text-red-500 uppercase tracking-wider">Number Battle</h2>
           <p className="text-sm text-slate-400">Round {round} &middot; Higher wins</p>
         </div>
         {status === 'waiting' && isHost && (
            <button onClick={() => onAction('start')} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-lg transition">
              Start Battle
            </button>
         )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-4 sm:p-6 flex flex-col justify-between">
         {/* Opponents Area */}
         {status !== 'waiting' && (
           <div className="flex flex-wrap gap-4 justify-center">
             {opponentIds.map(oId => {
               const p2State = playerStates[oId];
               if(!p2State) return null;
               return (
                 <div key={oId} className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 flex flex-col items-center gap-2 min-w-[150px]">
                   <span className="font-bold text-slate-300">{players[oId]?.name}</span>
                   <div className="flex gap-1 text-sm text-slate-400 bg-slate-900 px-3 py-1 rounded-full">
                     Score: <span className="text-white font-bold">{p2State.score}</span> | Streak: <span className="text-red-400 font-bold">{p2State.streak}x</span>
                   </div>
                   <div className="flex gap-1 mt-1 flex-wrap justify-center">
                      {/* Show remaining cards facedown */}
                      {p2State.available.map((_, i) => (
                         <div key={i} className="w-5 h-7 sm:w-6 sm:h-8 bg-red-900/50 border border-red-700/50 rounded flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500/50"></div>
                         </div>
                      ))}
                   </div>
                   {status === 'playing' && (
                     <div className="mt-2">
                        {p2State.locked ? (
                          <span className="text-green-500 text-sm font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Locked
                          </span>
                        ) : p2State.selected !== null && p2State.selected !== undefined ? (
                          <span className="text-yellow-500 text-sm italic">Selecting...</span>
                        ) : (
                          <span className="text-slate-500 text-sm">Thinking...</span>
                        )}
                     </div>
                   )}
                 </div>
               );
             })}
           </div>
         )}

         {/* Middle Arena */}
         <div className="flex-1 flex flex-col justify-center items-center py-4 min-h-[150px]">
            {status === 'playing' && (
               <div className="text-center animate-pulse">
                  <p className="text-slate-400 font-medium">
                     {myState.locked ? 'Waiting for opponent...' : 'Choose your number and lock it!'}
                  </p>
               </div>
            )}
            {renderResultArena()}
            {status === 'finished' && (
               <div className="text-center p-6 bg-slate-800 rounded-xl border border-red-500/30">
                 <h3 className="text-2xl font-bold text-white mb-2">Game Over!</h3>
                 <p className="text-slate-300">All numbers have been used.</p>
               </div>
            )}
         </div>

         {/* Player Self Area */}
         {status !== 'waiting' && myState && (
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
               <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-white text-lg">Your Numbers</span>
                    <div className="flex gap-3 text-sm">
                      <span className="bg-slate-900 px-3 py-1 rounded-full text-slate-300">Score <span className="text-white font-bold ml-1">{myState.score}</span></span>
                      <span className="bg-slate-900 px-3 py-1 rounded-full text-slate-300">Streak <span className="text-red-400 font-bold ml-1">{myState.streak}x</span></span>
                    </div>
                  </div>
                  {status === 'playing' && (
                    <button 
                      onClick={handleLock}
                      disabled={!isMyTurn || myState.selected === null}
                      className="px-6 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-md transition-all active:scale-95"
                    >
                      LOCK IN
                    </button>
                  )}
               </div>

               <div className="flex gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => renderNumberCard(num, myState.available || [], myState.selected))}
               </div>
            </div>
         )}
      </div>
    </div>
  );
}
