import React from 'react';

const icons = {
  rock: '🪨',
  paper: '📄',
  scissors: '✂️'
};

export default function RockPaperScissorsGame({ room, isHost, me, sendAction }) {
  const playerId = me?.id;
  const onAction = sendAction;
  const { gameState, players } = room;
  const { status, round, startingHp, playerStates = {}, lastResult, connectedIds = [] } = gameState;

  const opponentIds = connectedIds.filter(id => id !== playerId);
  const myState = playerStates[playerId] || {};

  const handleChoose = (move) => {
    if (status === 'choosing' && !myState.locked) onAction('choose_move', { move });
    if (status === 'optional_swap' && myState.swapAvailable > 0) onAction('use_swap', { move });
  };

  const handleLock = () => {
    if (status === 'choosing' && myState.selected) onAction('lock_move');
  };

  const handleToggleShield = () => {
    if (status === 'choosing' && !myState.locked) onAction('toggle_shield');
  };

  const renderMoveBtn = (move, count, active, disabled) => {
    let classes = `relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border-4 transition-all transform 
      ${active ? 'bg-indigo-600 border-indigo-400 scale-110 shadow-[0_0_15px_rgba(79,70,229,0.8)]' : 'bg-slate-800 border-slate-600 hover:bg-slate-700'} 
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${count === 0 ? 'opacity-70 grayscale-[0.5]' : ''}`;
      
    return (
      <button key={move} onClick={() => handleChoose(move)} disabled={disabled} className={classes}>
        <span className="text-3xl sm:text-5xl">{icons[move]}</span>
        <span className="text-xs uppercase font-bold text-slate-300 mt-2">{move}</span>
        <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2
          ${count > 0 ? 'bg-indigo-500 border-indigo-300 text-white' : 'bg-red-500 border-red-300 text-white animate-pulse'}`}>
          {count}
        </span>
        {count === 0 && <span className="absolute -bottom-6 text-[10px] text-red-400 font-bold whitespace-nowrap bg-slate-900/80 px-1 rounded">-50% DMG</span>}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-t border-slate-700 text-slate-200">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 shrink-0 flex flex-wrap justify-between items-center sm:hidden">
        <h2 className="text-lg sm:text-xl font-black text-indigo-400 uppercase tracking-widest w-full mb-2">RPS: Showdown</h2>
      </div>

      {status === 'waiting' && (
        <div className="flex flex-col items-center justify-center flex-1 p-6">
           <h2 className="text-3xl font-black text-indigo-400 uppercase tracking-widest mb-6">RPS: Showdown</h2>
           {isHost ? (
             <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 max-w-sm w-full space-y-4">
                <h3 className="text-lg font-bold text-center">Game Settings</h3>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase">Max HP</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 5, 7, 9].map(hp => (
                      <button key={hp} onClick={() => onAction('set_hp', { hp })} className={`py-2 rounded font-black ${startingHp === hp ? 'bg-indigo-600 border-2 border-indigo-400' : 'bg-slate-700'}`}>
                        {hp}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => onAction('start')} disabled={connectedIds.length !== 2} className="w-full py-3 mt-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:opacity-100 font-black rounded-lg shadow-[0_0_15px_rgba(22,163,74,0.5)]">
                  {connectedIds.length !== 2 ? `NEED EXACTLY 2 PLAYERS (${connectedIds.length}/2)` : 'START BATTLE'}
                </button>
             </div>
           ) : (
             <div className="text-center animate-pulse text-indigo-300 font-medium">Waiting for Host...</div>
           )}
        </div>
      )}

      {status !== 'waiting' && (
        <div className="flex-1 flex flex-col justify-between py-2 sm:py-6 px-2 overflow-y-auto">
           {/* Opponent Area */}
           <div className="flex justify-center mb-4">
             {opponentIds.map(oid => {
               const opp = playerStates[oid];
               if(!opp) return null;
               return (
                 <div key={oid} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col items-center w-full max-w-xs">
                    <span className="font-bold text-indigo-300 text-lg">{players[oid]?.name}</span>
                    <div className="w-full bg-slate-800 h-4 mt-2 rounded-full overflow-hidden border border-slate-700 relative">
                       <div className="h-full bg-red-500 transition-all duration-500" style={{width: `${Math.max(0, (opp.hp / startingHp) * 100)}%`}}></div>
                       <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">{opp.hp} / {startingHp} HP</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                       <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${opp.shieldAvailable ? 'border-blue-500 text-blue-500' : 'border-slate-700 text-slate-700'}`}>???</div>
                       <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${opp.swapAvailable ? 'border-yellow-500 text-yellow-500' : 'border-slate-700 text-slate-700'}`}>??</div>
                    </div>
                    {status === 'choosing' || status === 'optional_swap' ? (
                      <div className="mt-4">
                        {opp.locked ? <span className="text-green-500 font-bold text-sm tracking-wider flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> LOCKED IN</span> : <span className="text-slate-500 italic">Thinking...</span>}
                      </div>
                    ) : null}
                 </div>
               )
             })}
           </div>

           {/* Arena Center */}
           <div className="flex-1 flex flex-col items-center justify-center min-h-[150px] relative">
              {status === 'optional_swap' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-yellow-900/20 backdrop-blur-sm z-10 p-4 border-y-2 border-yellow-500/50">
                  <h3 className="text-2xl font-black text-yellow-400 uppercase tracking-widest drop-shadow">Reaction Window</h3>
                  <p className="max-w-sm text-center mt-2 text-yellow-200/80 mb-4 text-sm font-bold">Opponent locked. If you haven't swapped yet, click a card to swap your move!</p>
                  <p className="animate-pulse text-xl text-yellow-500">{myState.swapAvailable ? '1 SWAP REMAINING!' : 'No Swaps Left.'}</p>
                </div>
              )}
              {status === 'result' && lastResult && (
                <div className="flex flex-col items-center animate-fade-in bg-slate-900/90 p-6 rounded border-2 border-indigo-500 z-20">
                   {lastResult.tie ? (
                     <h3 className="text-3xl font-black tracking-widest text-slate-400">CLASH TIE!</h3>
                   ) : (
                     <>
                        <h3 className="text-3xl font-black mb-2 uppercase drop-shadow-[0_0_10px_rgba(79,70,229,0.8)]">{players[lastResult.winnerId]?.name} WINS ROUND</h3>
                        {lastResult.shieldBlocked ? (
                          <p className="text-xl font-bold text-blue-400 flex items-center gap-2 mt-2 border border-blue-400/50 px-4 py-2 rounded-xl bg-blue-900/30">
                            ??? DAMAGE BLOCKED!
                          </p>
                        ) : (
                          <div className="flex flex-col items-center mt-2">
                            <span className="text-red-500 font-bold tracking-wider mb-2">Dealing Damage</span>
                            <div className="flex gap-1 text-sm font-bold">
                              <span className="bg-indigo-900 text-indigo-300 px-3 py-1 rounded">Base/Modifier</span>
                              {/* Since state logic reduced the HP dynamically, we abstract damage text, can just show "HIT!" */}
                              <span className="bg-red-900 text-red-300 px-3 py-1 rounded shadow-[0_0_10px_rgba(239,68,68,0.8)]">DIRECT HIT!</span>
                            </div>
                          </div>
                        )}
                     </>
                   )}
                   <div className="flex gap-8 mt-6">
                      <div className="flex flex-col items-center gap-2">
                         <span className="text-sm font-bold text-slate-500 uppercase">{players[lastResult.id1]?.name}</span>
                         <div className="text-6xl bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">{icons[lastResult.m1]}</div>
                      </div>
                      <div className="flex items-center text-red-500 font-black">VS</div>
                      <div className="flex flex-col items-center gap-2">
                         <span className="text-sm font-bold text-slate-500 uppercase">{players[lastResult.id2]?.name}</span>
                         <div className="text-6xl bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">{icons[lastResult.m2]}</div>
                      </div>
                   </div>
                </div>
              )}
              {status === 'finished' && (
                <div className="text-center bg-red-900/50 p-6 border-2 border-red-500 rounded-xl z-20">
                  <h3 className="text-4xl font-black uppercase text-white drop-shadow-[0_0_10px_rgba(239,68,68,1)]">K.O. MATCH OVER</h3>
                </div>
              )}
           </div>

           {/* Player Area */}
           {myState && (
             <div className="mt-4 p-4 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
               <div className="flex justify-between items-end mb-4">
                 <div className="flex flex-col">
                   <div className="w-64 bg-slate-800 h-4 mt-2 rounded-full overflow-hidden border border-slate-700 relative">
                     <div className="h-full bg-green-500 transition-all duration-500" style={{width: `${Math.max(0, (myState.hp / startingHp) * 100)}%`}}></div>
                     <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">{myState.hp} / {startingHp} HP</span>
                   </div>
                   <div className="flex gap-2 mt-2">
                       <span className="bg-indigo-900/50 text-indigo-300 px-3 py-0.5 rounded-full text-xs font-bold border border-indigo-700 uppercase tracking-widest">
                         Streak: {myState.streak}x
                       </span>
                   </div>
                 </div>
                 
                 <div className="flex gap-2 relative">
                   {/* Shield Button */}
                   <button 
                     onClick={handleToggleShield} 
                     disabled={status !== 'choosing' || myState.locked || (myState.shieldAvailable === 0 && !myState.shieldActive)}
                     className={`flex items-center gap-2 px-4 py-2 border-2 font-bold rounded shadow-lg transition-all 
                       ${myState.shieldActive ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)]' : 'bg-slate-800 border-slate-700 text-slate-400 opacity-80'}
                       ${(status !== 'choosing' || myState.locked) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                   >
                     <span>??? {myState.shieldActive ? 'SHIELD ON' : 'SHIELD'}</span>
                   </button>
                   
                   {/* Lock Button */}
                   <button 
                     onClick={handleLock}
                     disabled={status !== 'choosing' || myState.locked || !myState.selected}
                     className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase rounded shadow-lg transition transform active:scale-95"
                   >
                     {myState.locked ? "LOCKED" : "LOCK IN"}
                   </button>
                 </div>
               </div>

               <div className="flex justify-center gap-4">
                 {['rock', 'paper', 'scissors'].map(m => renderMoveBtn(
                   m, 
                   myState.moves[m], 
                   myState.selected === m,
                   (status === 'locked' || status === 'result' || status === 'finished')
                 ))}
               </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
