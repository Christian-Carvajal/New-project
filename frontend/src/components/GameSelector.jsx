export default function GameSelector({ canSelect, currentGameId, games, onSelect }) {
  return (
    <section className="bg-slate-800 p-4 rounded-3xl w-full border border-slate-700">
      <div className="flex justify-between items-center gap-2 mb-4">
        <div>
          <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1">Host Controls</span>
          <h2 className="text-xl font-bold leading-none">Pick a game</h2>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-900 px-2 py-1 rounded-lg">
          {canSelect ? "You are host" : "Waiting for host"}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 hide-scrollbar-mobile">
        {games.map((game) => {
          const isActive = currentGameId === game.id;
          return (
            <button
              className={`shrink-0 w-36 text-left p-4 rounded-2xl border transition-colors snap-center ${
                isActive 
                  ? "bg-indigo-600 border-indigo-400 ring-2 ring-indigo-500/20" 
                  : "bg-slate-900 border-slate-700 hover:border-slate-500"
              } ${!canSelect && !isActive ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!canSelect && !isActive}
              key={game.id}
              onClick={() => canSelect && onSelect(game.id)}
            >
              <span className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isActive ? "text-indigo-200" : "text-slate-400"}`}>
                {game.category}
              </span>
              <strong className={`block text-base leading-tight mb-2 whitespace-normal break-words ${isActive ? "text-white" : "text-slate-200"}`}>
                {game.name}
              </strong>
              <span className={`block text-xs font-medium ${isActive ? "text-indigo-200" : "text-slate-500"}`}>
                {game.minPlayers}+ players
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
