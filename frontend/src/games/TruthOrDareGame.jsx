import React, { useState, useEffect } from 'react';

const SPICE_LEVELS = ['normal', 'flirty', 'spicy'];

export default function TruthOrDareGame({ room, isHost, playerId, onAction }) {
  const { gameState, players } = room;
  const { status, round, promptsRequired, chaosChance, spiceMode, playerStates = {}, currentTurnId, currentResult, connectedIds } = gameState;
  
  const myState = playerStates[playerId] || { truths: [], dares: [] };
  const opponentIds = connectedIds?.filter(id => id !== playerId) || [];

  const [activeTab, setActiveTab] = useState('truths');
  const [localTruths, setLocalTruths] = useState([]);
  const [localDares, setLocalDares] = useState([]);
  
  const [choice, setChoice] = useState('truth');
  const [target, setTarget] = useState('self');

  useEffect(() => {
    if (status === 'entry_phase' && !myState.locked) {
      if (myState.truths.length === 0 && localTruths.length === 0) {
         const emptyT = Array(promptsRequired).fill({ text: '', weight: Math.floor(100/promptsRequired), spice: spiceMode });
         setLocalTruths(emptyT);
      }
      if (myState.dares.length === 0 && localDares.length === 0) {
         const emptyD = Array(promptsRequired).fill({ text: '', weight: Math.floor(100/promptsRequired), spice: spiceMode });
         setLocalDares(emptyD);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, myState.locked, promptsRequired]);

  const handleEntryChange = (type, index, field, value) => {
    const list = type === 'truths' ? [...localTruths] : [...localDares];
    list[index] = { ...list[index], [field]: value };
    if (type === 'truths') setLocalTruths(list);
    else setLocalDares(list);
    
    onAction('update_prompts', { truths: type === 'truths' ? list : localTruths, dares: type === 'dares' ? list : localDares });
  };

  const getWeightSum = (list) => list.reduce((s, p) => s + Number(p.weight), 0);
  const tWeight = getWeightSum(localTruths);
  const dWeight = getWeightSum(localDares);

  const handleLock = () => {
    if (tWeight === 100 && dWeight === 100 && localTruths.every(t=>t.text.trim()) && localDares.every(d=>d.text.trim())) {
      onAction('lock_prompts');
    }
  };

  const handleTurnSubmit = () => {
    if (status === 'turn_select' && currentTurnId === playerId) {
      onAction('choose_action', { choice, target });
    }
  };

  const renderSpiceSelect = (type, idx, val) => (
    <select 
       value={val}
       onChange={e => handleEntryChange(type, idx, 'spice', e.target.value)}
       className="flex-1 bg-slate-950 border border-rose-900/50 rounded px-2 py-1 text-xs focus:outline-none text-rose-300 font-bold appearance-none"
    >
       <option value="normal">?? Normal</option>
       {SPICE_LEVELS.indexOf(spiceMode) >= 1 && <option value="flirty">?? Flirty</option>}
       {SPICE_LEVELS.indexOf(spiceMode) >= 2 && <option value="spicy">??? Spicy</option>}
    </select>
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 border-t border-slate-700 text-slate-200">
      {/* Header */}
      <div className="p-3 bg-slate-900 border-b border-rose-900/50 shrink-0 flex flex-col sm:flex-row justify-between items-center z-20 shadow-[0_5px_15px_rgba(225,29,72,0.1)] gap-2">
         <div className="flex flex-col items-center sm:items-start">
           <h2 className="text-xl font-black text-rose-500 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]">T/D: Chaos Mode</h2>
           <div className="flex gap-3 text-xs text-rose-300 font-bold uppercase tracking-wider mt-1">
             <span>Round {round}</span>
             <span>Chaos: {Math.round(chaosChance * 100)}%</span>
             <span>Max Spice: {spiceMode}</span>
           </div>
         </div>
         {status === 'waiting' && isHost && (
            <div className="flex gap-2">
              <select onChange={(e) => onAction('set_spice_mode', {mode: e.target.value})} value={spiceMode} className="bg-slate-800 text-rose-300 border border-rose-500/50 uppercase font-black text-sm rounded px-3">
                <option value="normal">Normal</option>
                <option value="flirty">Flirty</option>
                <option value="spicy">Spicy</option>
              </select>
              <button onClick={() => onAction('start')} className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded shadow transition uppercase active:scale-95">
                Start Game
              </button>
            </div>
         )}
         {status === 'waiting' && !isHost && (
            <p className="text-rose-400 font-bold animate-pulse text-sm">Waiting for host settings...</p>
         )}
      </div>

      <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto p-4 sm:p-6">
        
        {/* Entry Phase */}
        {status === 'entry_phase' && (
          <div className="flex flex-col gap-6 animate-fade-in pb-10">
             
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 border border-rose-900/50 bg-slate-900/80 rounded-xl items-center shadow-lg">
              <div className="flex gap-2">
                 <button onClick={() => setActiveTab('truths')} className={`px-6 py-2 font-black uppercase text-sm rounded-lg transition-colors border ${activeTab === 'truths' ? 'bg-rose-600/20 border-rose-500 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>Truths ({tWeight}%)</button>
                 <button onClick={() => setActiveTab('dares')} className={`px-6 py-2 font-black uppercase text-sm rounded-lg transition-colors border ${activeTab === 'dares' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>Dares ({dWeight}%)</button>
              </div>
              
              {!myState.locked ? (
                 <button 
                  onClick={handleLock} 
                  disabled={tWeight !== 100 || dWeight !== 100 || localTruths.some(t=>!t.text.trim()) || localDares.some(d=>!d.text.trim())}
                  className="px-8 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black uppercase rounded shadow transition active:scale-95 whitespace-nowrap"
                 >
                   LOCK PROMPTS
                 </button>
              ) : (
                 <span className="text-green-500 uppercase font-black flex items-center gap-2 px-4"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> LOCKED IN</span>
              )}
            </div>

            {/* List */}
            {!myState.locked && (
              <div className="grid gap-4 sm:grid-cols-2">
                 {(activeTab === 'truths' ? localTruths : localDares).map((prompt, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border border-slate-700 shadow-inner flex flex-col gap-3 ${activeTab === 'truths' ? 'bg-rose-950/20' : 'bg-indigo-950/20'}`}>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-black uppercase tracking-widest ${activeTab === 'truths' ? 'text-rose-500' : 'text-indigo-500'}`}>{activeTab.slice(0,-1)} #{idx + 1}</span>
                          <span className="text-xs bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white font-bold">{prompt.weight}% Chance</span>
                        </div>
                        <input 
                           type="text" 
                           placeholder={`Enter ${activeTab.slice(0,-1)}...`} 
                           maxLength={100}
                           value={prompt.text}
                           onChange={(e) => handleEntryChange(activeTab, idx, 'text', e.target.value)}
                           className={`w-full bg-slate-900 border rounded px-3 py-2 text-sm focus:outline-none transition-colors ${activeTab==='truths'?'border-rose-900/50 focus:border-rose-500':'border-indigo-900/50 focus:border-indigo-500'}`}
                        />
                        <div className="flex flex-col gap-1 mt-1">
                           <label className="text-[10px] uppercase font-bold text-slate-500">Probability Weight (1-100)</label>
                           <input 
                             type="range" min="1" max="100" 
                             value={prompt.weight} 
                             onChange={(e) => handleEntryChange(activeTab, idx, 'weight', Number(e.target.value))}
                             className={`w-full ${activeTab==='truths'?'accent-rose-500':'accent-indigo-500'}`}
                           />
                        </div>
                        <div className="flex flex-col gap-1 mt-1">
                           <label className="text-[10px] uppercase font-bold text-slate-500">Spice Level</label>
                           {renderSpiceSelect(activeTab, idx, prompt.spice)}
                        </div>
                    </div>
                 ))}
               </div>
            )}

            {/* Waiting Opponents */}
            <div className="flex gap-4 justify-center mt-4">
               {opponentIds.map(oid => {
                 const opp = playerStates[oid];
                 return (
                   <div key={oid} className="bg-slate-900/80 px-6 py-3 rounded-xl border border-slate-800 flex flex-col items-center">
                     <span className="text-sm font-bold text-slate-400">{players[oid]?.name}</span>
                     {opp?.locked ? (
                       <span className="text-green-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mt-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> READY</span>
                     ) : (
                       <span className="text-rose-500 italic text-xs mt-1 animate-pulse uppercase tracking-widest text-center">Writing<br/>Devilish Things</span>
                     )}
                   </div>
                 )
               })}
            </div>
          </div>
        )}

        {/* Turn Select Phase */}
        {status === 'turn_select' && (
           <div className="flex flex-col items-center justify-center pt-10 animate-fade-in">
              {currentTurnId === playerId ? (
                <div className="bg-slate-900/90 border border-slate-700 shadow-2xl rounded-2xl p-8 max-w-lg w-full text-center flex flex-col gap-6">
                   <h2 className="text-3xl font-black text-rose-500 uppercase tracking-widest mb-2">Choose Fast!</h2>
                   <div className="flex gap-4 w-full">
                     <button 
                       onClick={() => setChoice('truth')}
                       className={`flex-1 py-4 border-2 rounded-xl text-xl font-black uppercase transition-transform ${choice === 'truth' ? 'bg-rose-600/20 border-rose-500 text-rose-400 scale-105 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                     >Truth</button>
                     <button 
                       onClick={() => setChoice('dare')}
                       className={`flex-1 py-4 border-2 rounded-xl text-xl font-black uppercase transition-transform ${choice === 'dare' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 scale-105 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                     >Dare</button>
                   </div>
                   <div className="flex flex-col gap-2">
                     <label className="text-xs uppercase font-bold text-slate-400 tracking-widest">Select Target</label>
                     <select value={target} onChange={e=>setTarget(e.target.value)} className="bg-slate-950 border border-slate-700 p-3 rounded font-bold text-center appearance-none focus:outline-none focus:border-rose-500">
                        <option value="self">Myself (-The Brave-)</option>
                        <option value="opponent">Opponent (-The Victim-)</option>
                        <option value="random">Random (-The Wheel-)</option>
                     </select>
                   </div>
                   <button onClick={handleTurnSubmit} className="mt-4 w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black text-xl uppercase shadow-lg transition active:scale-95 tracking-widest">Submit Choice</button>
                </div>
              ) : (
                <div className="text-center p-10 bg-slate-900/50 rounded-xl border border-rose-900/30">
                   <h2 className="text-2xl font-bold uppercase text-slate-500 mb-2">Waiting for Fate</h2>
                   <p className="text-rose-500 font-black text-3xl animate-pulse tracking-widest">{players[currentTurnId]?.name} IS CHOOSING...</p>
                </div>
              )}
           </div>
        )}

        {/* Reveal / Execute Phases */}
        {(status === 'reveal' || status === 'execute') && currentResult && (
           <div className="flex flex-col items-center pt-8">
              <div className={`w-full max-w-xl rounded-2xl border-4 shadow-2xl p-6 sm:p-10 flex flex-col items-center animate-[zoomIn_0.3s_ease-out] relative overflow-hidden text-center
                ${currentResult.finalChoice === 'truth' ? 'bg-rose-950/90 border-rose-500/80 shadow-[0_0_40px_rgba(244,63,94,0.3)]' : 'bg-indigo-950/90 border-indigo-500/80 shadow-[0_0_40px_rgba(99,102,241,0.3)]'}`}>
                 
                 {currentResult.spice === 'flirty' && <div className="absolute inset-0 bg-pink-500/10 pointer-events-none animate-pulse"></div>}
                 {currentResult.spice === 'spicy' && <div className="absolute inset-0 bg-red-600/10 pointer-events-none animate-[ping_2s_infinite]"></div>}
                 
                 {currentResult.chaosEvent && (
                    <div className="w-full absolute top-0 bg-red-600 font-black text-white text-xs sm:text-sm py-1.5 uppercase tracking-widest shadow-[0_0_15px_rgba(220,38,38,1)] left-0 text-center animate-pulse">
                       {currentResult.chaosEvent.replaceAll('_', ' ')} OVERRIDE!
                    </div>
                 )}

                 <span className={`text-sm sm:text-base font-black tracking-widest uppercase mb-1 z-10 ${currentResult.chaosEvent ? 'mt-4' : ''}`}>
                    {currentResult.spice === 'spicy' ? '??? SPICY ' : currentResult.spice === 'flirty' ? '?? FLIRTY ' : ''}
                    {currentResult.finalChoice}
                 </span>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6 z-10">Target: <span className="text-white bg-slate-900 px-2 py-0.5 rounded">{currentResult.actualTargets === 'both' ? 'BOTH PLAYERS!' : currentResult.actualTargets === 'random' ? 'RANDOM PLAYER' : currentResult.actualTargets === 'opponent' ? 'THE OPPONENT' : currentResult.actualTargets === 'self' ? players[currentTurnId]?.name : players[currentTurnId]?.name}</span></p>
                 
                 <h3 className={`text-3xl sm:text-5xl font-black leading-tight drop-shadow-md z-10 mb-8 ${currentResult.skipped ? 'line-through text-slate-500' : 'text-white'}`}>
                    "{currentResult.prompt?.text}"
                 </h3>

                 {status === 'reveal' && !currentResult.skipped && (
                   <div className="flex gap-4 w-full z-10">
                     <button onClick={() => onAction('use_reroll')} disabled={myState.rerollAvailable === 0} className="flex-1 py-3 bg-yellow-600 disabled:opacity-50 disabled:grayscale hover:bg-yellow-500 font-black uppercase text-sm rounded shadow">Reroll (1x)</button>
                     <button onClick={() => onAction('use_skip')} disabled={myState.skipAvailable === 0 || currentResult.actualTargets !== 'self'} className="flex-1 py-3 bg-rose-800 disabled:opacity-50 disabled:grayscale hover:bg-rose-700 font-black uppercase text-sm rounded shadow">Skip (1x)</button>
                   </div>
                 )}

                 {status === 'reveal' && (
                    <div className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse z-10">
                       Reaction Window Active...
                    </div>
                 )}

                 {status === 'execute' && (
                    <div className="w-full z-10 flex flex-col gap-4 items-center">
                       {currentResult.skipped && (
                          <div className="w-full bg-slate-900 border border-red-500 text-red-500 font-black p-4 text-xl uppercase tracking-widest">
                            SKIPPED COWARD!
                          </div>
                       )}
                       <button onClick={() => onAction('complete_turn')} className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black text-xl uppercase tracking-widest shadow-[0_0_15px_rgba(22,163,74,0.6)] rounded-xl group overflow-hidden relative">
                          <span className="relative z-10 shadow-black drop-shadow">Complete Turn</span>
                          <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out z-0"></div>
                       </button>
                    </div>
                 )}
              </div>
           </div>
        )}

      </div>
    </div>
  );
}
