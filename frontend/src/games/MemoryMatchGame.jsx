import React from 'react';

export default function MemoryMatchGame({ room, isHost, playerId, onAction }) {
  const { gameState } = room;
  const { status, board = [], turnPlayerId, scoresByPlayer = {}, round } = gameState;

  const isMyTurn = status === 'playing' && turnPlayerId === playerId;

  const renderCard = (card, index) => {
    return (
      <button
        key={card.id}
        onClick={() => onAction('flip_card', { index })}
        disabled={!isMyTurn || card.matched || card.isFlipped}
        className={`w-full aspect-[3/4] rounded-lg transition-all duration-300 transform preserve-3d
          ${(card.isFlipped || card.matched) ? 'rotate-y-180' : 'hover:-translate-y-1 bg-indigo-600'}
          ${card.matched ? 'opacity-50' : ''}
          relative`}
        style={{ perspective: '1000px' }}
      >
         <div className="absolute inset-0 backface-hidden flex items-center justify-center rounded-lg shadow-inner border-2 border-indigo-400">
             {!card.isFlipped && !card.matched && (
                 <span className="text-2xl text-indigo-300 opacity-50">?</span>
             )}
         </div>
         <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center rounded-lg bg-white border-2 border-indigo-200 shadow-md">
             <span className="text-4xl">{card.value}</span>
         </div>
      </button>
    );
  };
  
  // Custom CSS for flip animation needed since tailwind doesn't have it built-in cleanly
  const extraStyles = `
    .preserve-3d { transform-style: preserve-3d; }
    .backface-hidden { backface-visibility: hidden; }
    .rotate-y-180 { transform: rotateY(180deg); }
  `;

  return (
    <div className="flex flex-col h-full bg-slate-900 border-t border-slate-700">
      <style>{extraStyles}</style>
      <div className="p-4 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex justify-between items-center mb-2">
           <h2 className="text-xl font-bold text-white">Memory Match</h2>
           <span className="px-3 py-1 bg-indigo-900/50 text-indigo-200 rounded-full text-sm font-medium">
             Round {round || 1}
           </span>
        </div>
        
        {status === 'waiting' && isHost && (
          <button
            onClick={() => onAction('start')}
            className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded font-medium transition"
          >
            Start Game
          </button>
        )}
        {status === 'waiting' && !isHost && (
          <p className="text-center text-slate-400">Waiting for host to start...</p>
        )}
        
        {status === 'finished' && (
           <div className="text-center p-3 rounded bg-green-900/40 text-green-300 border border-green-700/50 mb-3">
             <p className="font-bold">Round Over!</p>
             <p className="text-sm">Starting next round shortly...</p>
           </div>
        )}

        {status === 'playing' && (
           <div className={`text-center p-2 rounded ${isMyTurn ? 'bg-indigo-600' : 'bg-slate-700'}`}>
               <p className="font-medium text-white">
                  {isMyTurn ? 'Your Turn! Pick two cards.' : 'Waiting for opponent...'}
               </p>
           </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
         {/* Dynamic grid based on pair count */}
         <div 
           className="grid gap-3 max-w-2xl mx-auto"
           style={{
             gridTemplateColumns: `repeat(${Math.max(4, Math.ceil(Math.sqrt(board.length)))}, minmax(0, 1fr))`
           }}
         >
            {board.map((card, idx) => renderCard(card, idx))}
         </div>
      </div>
      
      {/* Score overview sticky footer */}
      {status !== 'waiting' && (
          <div className="p-3 bg-slate-800/80 border-t border-slate-700 overflow-x-auto whitespace-nowrap">
              <div className="flex gap-4 items-center pl-2">
                 <span className="text-sm text-slate-400 uppercase tracking-wider font-bold">Matches:</span>
                 {Object.entries(scoresByPlayer).map(([id, score]) => (
                     <div key={id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${id === playerId ? 'bg-indigo-900/60 border border-indigo-700/50' : 'bg-slate-700/50'}`}>
                         <div className={`w-2 h-2 rounded-full ${id === turnPlayerId ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
                         <span className="text-sm text-slate-200">{room.players[id]?.name || 'Player'}</span>
                         <span className="text-sm font-bold text-indigo-300">{score}</span>
                     </div>
                 ))}
              </div>
          </div>
      )}
    </div>
  );
}
