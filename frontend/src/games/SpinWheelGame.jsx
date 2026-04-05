import React, { useState, useEffect } from 'react';

export default function SpinWheelGame({ room, isHost, me, sendAction }) {
  const playerId = me?.id;
  const onAction = sendAction;
  const { gameState, players } = room;
  const { status, round, entriesRequired, chaosChance, playerStates = {}, wheel = [], currentResult, targetAngle } = gameState;
  
  const myState = playerStates[playerId] || { entries: [] };
  const opponentIds = Object.keys(playerStates).filter(id => id !== playerId);

  const [localEntries, setLocalEntries] = useState([]);

  useEffect(() => {
    if (status === 'entry_phase' && !myState.locked) {
      if (myState.entries.length === 0 && localEntries.length === 0) {
         setLocalEntries(Array.from({ length: entriesRequired }, () => ({ text: '', weight: Math.floor(100/entriesRequired), target: 'self' })));
      } else if (localEntries.length !== entriesRequired) {
         setLocalEntries(Array.from({ length: entriesRequired }, () => ({ text: '', weight: Math.floor(100/entriesRequired), target: 'self' })));
      }
    }
  }, [entriesRequired, status, myState.locked]);

  const handleEntryChange = (index, field, value) => {
    const updated = [...localEntries];
    updated[index] = { ...updated[index], [field]: value };
    setLocalEntries(updated);
    onAction('update_entries', { entries: updated });
  };

  const totalWeight = localEntries.reduce((sum, e) => sum + Number(e.weight), 0);

  const handleLock = () => {
    if (totalWeight === 100 && localEntries.every(e => e.text.trim() !== '')) {
      onAction('lock_entries');
    }
  };

  // Rendering the dynamic conic gradient pie chart
  const renderWheel = () => {
    if (wheel.length === 0) return null;
    let accumulated = 0;
    
    // Generate color palette based on indexes
    const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#6366f1", "#f43f5e", "#0ea5e9"];
    
    // Map slice weights to degrees out of total wheel weight
    const totalWheelWeight = wheel.reduce((sum, e) => sum + e.weight, 0);
    
    const gradientStops = wheel.map((entry, idx) => {
      const percentage = (entry.weight / totalWheelWeight) * 100;
      const start = accumulated;
      accumulated += percentage;
      return `${colors[idx % colors.length]} ${start}% ${accumulated}%`;
    }).join(', ');

    return (
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden transition-transform ease-out" 
           style={{  
              background: `conic-gradient(${gradientStops})`, 
              transform: `rotate(${status === 'spin' || status === 'reveal' || status === 'execute_result' ? targetAngle : 0}deg)`,
              transitionDuration: status === 'spin' ? '5000ms' : '0ms'
           }}>
             
          {/* Wheel Inner Ring (Holes out center) */}
          <div className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] z-10 flex items-center justify-center">
             <span className="text-xl font-black text-indigo-500 rounded-full">SPIN</span>
          </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-t border-slate-700 text-slate-200">
      {/* Header */}
      <div className="p-3 bg-slate-800 border-b border-slate-700 shrink-0 flex justify-between items-center shadow-md z-20">
         <div>
           <h2 className="text-xl font-black text-fuchsia-400 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(192,38,211,0.6)]">Mystery Chaos Wheel</h2>
           <p className="text-xs text-fuchsia-300 font-bold tracking-wider">Round {round} | Chaos Chance: {Math.round(chaosChance * 100)}%</p>
         </div>
         {status === 'waiting' && isHost && (
            <button onClick={() => onAction('start')} className="px-6 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded shadow-[0_0_15px_rgba(192,38,211,0.5)] transition uppercase active:scale-95 border-2 border-fuchsia-400">
              Start Chaos
            </button>
         )}
      </div>

      <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-2 py-4">
        
        {/* Entry Phase */}
        {status === 'entry_phase' && (
          <div className="flex flex-col gap-6 animate-fade-in pb-10">
            <div className="flex flex-wrap gap-4 justify-between items-center bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-md">
               <h3 className="text-lg font-bold text-slate-300">Submit Your Entries</h3>
               <div className={`px-4 py-2 font-black rounded-lg border-2 ${totalWeight === 100 ? 'bg-green-900/50 border-green-500 text-green-400' : 'bg-red-900/50 border-red-500 text-red-400'}`}>
                 Total Weight: {totalWeight} / 100
               </div>
               {myState.locked ? (
                 <span className="text-green-500 font-bold px-6 py-2 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span> LOCKED IN</span>
               ) : (
                 <button 
                  onClick={handleLock} 
                  disabled={totalWeight !== 100 || !localEntries.every(e => e.text.trim())}
                  className="px-6 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:grayscale text-white font-black uppercase rounded shadow-lg transition active:scale-95"
                 >
                   LOCK ENTRIES ({entriesRequired})
                 </button>
               )}
            </div>

            {/* Form */}
            {!myState.locked && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                 {localEntries.map((entry, idx) => (
                    <div key={idx} className="bg-slate-800 p-4 rounded-xl border border-slate-600 flex flex-col gap-3 shadow-inner">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-400 text-sm">Entry #{idx + 1}</span>
                          <span className="text-xs bg-slate-900 px-2 py-1 rounded text-fuchsia-400 font-bold">{entry.weight}%</span>
                        </div>
                        <input 
                           type="text" 
                           placeholder="Dare / Task / Reward..." 
                           maxLength={45}
                           value={entry.text}
                           onChange={(e) => handleEntryChange(idx, 'text', e.target.value)}
                           className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-fuchsia-500 transition-colors"
                        />
                        <div className="flex flex-col gap-1">
                           <label className="text-[10px] uppercase font-bold text-slate-500">Weight (Probability)</label>
                           <input 
                             type="range" min="1" max="100" 
                             value={entry.weight} 
                             onChange={(e) => handleEntryChange(idx, 'weight', Number(e.target.value))}
                             className="accent-fuchsia-500 w-full"
                           />
                        </div>
                        <div className="flex flex-col gap-1">
                           <label className="text-[10px] uppercase font-bold text-slate-500">Target</label>
                           <select 
                             value={entry.target}
                             onChange={(e) => handleEntryChange(idx, 'target', e.target.value)}
                             className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-fuchsia-500 appearance-none"
                           >
                             <option value="self">Myself</option>
                             <option value="opponent">Opponent</option>
                             <option value="both">Both Players</option>
                             <option value="random">Random</option>
                           </select>
                        </div>
                    </div>
                 ))}
               </div>
            )}
            
            {/* Opponent Status */}
            <div className="flex gap-4 justify-center mt-4">
               {opponentIds.map(oid => {
                 const opp = playerStates[oid];
                 return (
                   <div key={oid} className="bg-slate-800/80 px-6 py-3 rounded-xl border border-slate-700 flex flex-col items-center">
                     <span className="text-sm font-bold text-slate-400">{players[oid]?.name}</span>
                     {opp?.locked ? (
                       <span className="text-green-500 font-bold text-sm tracking-wider flex items-center gap-2 mt-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> READY</span>
                     ) : (
                       <span className="text-yellow-500 italic text-sm mt-1 animate-pulse">Building Wheel...</span>
                     )}
                   </div>
                 )
               })}
            </div>
          </div>
        )}

        {/* Spin / Reveal / Execute Phases */}
        {(status === 'spin' || status === 'reveal' || status === 'execute_result') && (
          <div className="flex flex-col items-center justify-center pt-8">
            
            {/* Wheel Container relative wrapper for the pointer */}
            <div className="relative mb-12">
               {/* Fixed Top Pointer */}
               <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-white z-30 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]"></div>
               {renderWheel()}
            </div>

            {/* Reaction Window / Result Reveal */}
            {status === 'spin' && (
              <h2 className="text-3xl font-black uppercase text-fuchsia-400 animate-pulse tracking-widest drop-shadow">Spinning Fate...</h2>
            )}

            {(status === 'reveal' || status === 'execute_result') && currentResult && (
               <div className="bg-slate-800/90 border-2 border-fuchsia-500 p-6 rounded-xl shadow-2xl max-w-lg w-full flex flex-col items-center text-center animate-fade-in relative overflow-hidden">
                 
                 {currentResult.chaosEvent && (
                    <div className="absolute top-0 left-0 right-0 bg-red-600 text-white font-black py-1 uppercase text-xs tracking-[0.2em] shadow-[0_0_15px_rgba(220,38,38,1)] z-10 flex items-center justify-center gap-2">
                       <span>?? CHAOS TRIGGERED:</span>
                       <span className="text-yellow-300">
                         {currentResult.chaosEvent === 'swap_target' && 'TARGET SWAPPED!'}
                         {currentResult.chaosEvent === 'both_execute' && 'COLLATERAL DAMAGE (BOTH)!'}
                         {currentResult.chaosEvent === 'jackpot' && '+3 POINTS JACKPOT!'}
                       </span>
                    </div>
                 )}

                 <div className={`pt-4 ${currentResult.chaosEvent ? 'mt-4' : ''}`}>
                    <span className="text-[10px] tracking-widest text-slate-400 uppercase font-bold bg-slate-900 px-3 py-1 rounded-full mb-4 inline-block">
                       Target: <span className="text-fuchsia-400">{currentResult.actualTarget}</span>
                    </span>
                    <h2 className={`text-2xl sm:text-4xl font-black uppercase tracking-tight leading-tight ${currentResult.blocked ? 'line-through text-slate-500' : 'text-white'}`}>
                      "{currentResult.text}"
                    </h2>
                    
                    {currentResult.blocked && (
                       <p className="text-blue-400 font-bold mt-4 text-xl border border-blue-500 bg-blue-900/30 px-4 py-2 rounded">
                          ??? BLOCKED BY {players[currentResult.blockedBy]?.name}
                       </p>
                    )}
                 </div>

                 {status === 'reveal' && (
                   <div className="mt-8 pt-4 border-t border-slate-700 w-full flex gap-4 justify-center">
                     <button 
                       onClick={() => onAction('use_reroll')} 
                       disabled={myState.rerollAvailable === 0}
                       className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:grayscale text-yellow-50 font-black uppercase rounded shadow transition"
                     >
                       REROLL (1x)
                     </button>
                     <button 
                       onClick={() => onAction('use_shield')} 
                       disabled={myState.shieldAvailable === 0 || currentResult.blocked}
                       className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:grayscale text-blue-50 font-black uppercase rounded shadow transition"
                     >
                       SHIELD (1x)
                     </button>
                   </div>
                 )}

                 {status === 'execute_result' && (
                    <div className="mt-6 text-fuchsia-400 font-bold uppercase animate-pulse text-sm tracking-widest">
                       Finalizing Fate...
                    </div>
                 )}
               </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
