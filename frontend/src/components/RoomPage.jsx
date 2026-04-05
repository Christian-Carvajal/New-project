import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ChatPanel from "./ChatPanel.jsx";
import GameSelector from "./GameSelector.jsx";
import Scoreboard from "./Scoreboard.jsx";
import { GAME_COMPONENTS, FallbackGame } from "../games/index.jsx";
import { emitWithAck, ensureSocketConnection, socket } from "../utils/socket.js";
import { playUiSound } from "../utils/sound.js";
import { clearRoomSession, getRoomSession, saveRoomSession } from "../utils/storage.js";

export default function RoomPage({ socketConnected, soundEnabled }) {
  const { roomId: routeRoomId = "" } = useParams();
  const roomId = routeRoomId.toUpperCase();
  const location = useLocation();
  const navigate = useNavigate();
  const [roomState, setRoomState] = useState(null);
  const [joinName, setJoinName] = useState(() => location.state?.preferredUsername || getRoomSession(roomId)?.username || "");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  
  const [activeTab, setActiveTab] = useState('game'); 

  const attemptedAutoJoinRef = useRef(false);
  const previousStateRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function doJoin() {
      if (!roomId || joining || roomState) return;
      if (attemptedAutoJoinRef.current) return;
      attemptedAutoJoinRef.current = true;

      const session = getRoomSession(roomId);
      if (session?.playerToken && session?.username) {
        setJoining(true);
        try {
          await ensureSocketConnection();
          const state = await emitWithAck("room:join", { 
            roomId, 
            playerToken: session.playerToken,
            username: session.username 
          });
          if (mounted) {
            setRoomState(state);
            setJoinName(session.username);
            setError("");
          }
        } catch (err) {
          if (mounted) {
            clearRoomSession(roomId);
            setError("Session expired. Please join again.");
          }
        } finally {
          if (mounted) setJoining(false);
        }
      }
    }
    if (socketConnected && roomId) {
      doJoin();
    }
    return () => { mounted = false; };
  }, [roomId, roomState, joining, socketConnected]);

  useEffect(() => {
    function handleRoomUpdate(newState) {
      setRoomState(prevState => {
        if (soundEnabled && prevState && newState) {
          const wasPlaying = prevState.currentGameId && prevState.gameStarted;
          const isPlaying = newState.currentGameId && newState.gameStarted;
          
          if (!wasPlaying && isPlaying) playUiSound('gameStart');
          else if (wasPlaying && !isPlaying) playUiSound('gameOver');
          else if (prevState.players.length < newState.players.length) playUiSound('playerJoin');
          else if (prevState.players.length > newState.players.length) playUiSound('playerLeave');
          else if (prevState.currentGameId !== newState.currentGameId) playUiSound('click');
        }
        return newState;
      });
    }
    
    function handleError(msg) {
      setError(msg);
      if (msg.includes("Invalid") || msg.includes("not found")) {
        clearRoomSession(roomId);
        setRoomState(null);
      }
    }

    socket.on("room:update", handleRoomUpdate);
    socket.on("error", handleError);
    return () => {
      socket.off("room:update", handleRoomUpdate);
      socket.off("error", handleError);
    };
  }, [roomId, soundEnabled]);

  async function handleManualJoin(e) {
    if (e) e.preventDefault();
    if (!joinName.trim()) return setError("Please enter a name");
    setJoining(true);
    setError("");
    try {
      await ensureSocketConnection();
      const state = await emitWithAck("room:join", { roomId, username: joinName.trim() });
      saveRoomSession(roomId, { playerToken: state.playerToken, username: joinName.trim() });
      setRoomState(state);
    } catch (err) {
      setError(err.message || "Failed to join");
    } finally {
      setJoining(false);
    }
  }

  const copyInviteLink = () => {
    // Vite provides the base path from vite.config.js automatically here!
    const baseUrl = import.meta.env.BASE_URL; 
    const url = `${window.location.origin}${baseUrl}#/room/${roomId}`;
    
    navigator.clipboard.writeText(url);
    if(soundEnabled) playUiSound('click');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!roomState) {
    return (
      <div className="min-h-[100dvh] bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
        <main className="w-full max-w-sm flex flex-col gap-6 bg-slate-800 p-6 rounded-3xl border border-slate-700">
          <h2 className="font-bold text-2xl mb-1">Join Room {roomId}</h2>
          {error && <div className="bg-red-900/40 text-red-200 border border-red-800 p-3 rounded-xl text-center text-sm font-medium">{error}</div>}
          <form onSubmit={handleManualJoin} className="flex flex-col gap-4">
             <input type="text" required maxLength={18} autoFocus onChange={(e) => setJoinName(e.target.value)} value={joinName} className="bg-slate-900 border border-slate-700 rounded-xl p-3.5 outline-none focus:border-indigo-500 font-medium" placeholder="Your Name" />
             <div className="flex gap-3">
               <button type="button" onClick={() => navigate("/")} className="flex-1 bg-slate-700 text-slate-300 rounded-xl font-bold">Cancel</button>
               <button type="submit" disabled={joining || !socketConnected} className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50">{joining ? "Joining..." : "Join Room"}</button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  const { players, hostId, currentGameId, gameStarted, gameState, games } = roomState;
  const me = players.find(p => p.id === socket.id);
  const isHost = me?.id === hostId;

  function handleSelectGame(gameId) {
    if (isHost) {
      if(soundEnabled) playUiSound('click');
      socket.emit("room:selectGame", { roomId, gameId });
    }
  }

  function handleToggleGame() {
    if (isHost) {
      if(soundEnabled) playUiSound('click');
      if (gameStarted) socket.emit("game:end", { roomId });
      else socket.emit("game:start", { roomId });
    }
  }

  const ActiveGameConfig = games.find(g => g.id === currentGameId) || {};
  const GameComponent = GAME_COMPONENTS[currentGameId] || FallbackGame;

  return (
    <div className="h-[100dvh] bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 z-10 shrink-0">
         <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none block mb-1">Room Code</span>
            <div className="flex items-center gap-2">
               <h1 className="font-mono text-xl font-bold tracking-widest">{roomId}</h1>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block text-xs font-medium text-slate-400">Players</span>
              <span className="block font-bold text-sm">{players.length}</span>
            </div>
            <button onClick={() => navigate("/")} className="bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white border border-slate-700">Leave</button>
         </div>
      </header>

      {/* Main Content Area (Mobile & Desktop) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto w-full relative">
        <div className="p-4 md:p-8 flex flex-col gap-6 max-w-5xl mx-auto w-full flex-1 pb-24 md:pb-8">
           
           {/* Desktop Header */}
           <div className="hidden md:flex justify-between items-end mb-4">
              <div>
                 <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1.5 block">Playing in Room</span>
                 <div className="flex items-center gap-4">
                    <h1 className="font-mono text-4xl font-black tracking-widest">{roomId}</h1>
                    <button onClick={copyInviteLink} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 py-1.5 px-3 rounded-lg transition-colors">
                      {copied ? "Copied!" : "Copy Link"}
                    </button>
                 </div>
              </div>
              <button onClick={() => navigate("/")} className="bg-slate-800 hover:bg-red-900/40 hover:text-red-200 border border-slate-700 hover:border-red-800 py-2 px-4 rounded-xl font-bold transition-colors">Leave Room</button>
           </div>

           {/* Mobile conditional views / Desktop grid */}
           <div className="flex flex-col gap-6 md:grid md:grid-cols-12 flex-1">
              {/* Game View */}
              <div className={`md:col-span-8 flex flex-col gap-6 flex-1 ${activeTab !== 'game' ? 'hidden md:flex' : 'flex'}`}>
                {/* Invite Strip (Mobile Only) */}
                <div className="md:hidden flex items-center justify-between bg-slate-800 border border-slate-700 p-4 rounded-2xl">
                  <div>
                    <span className="block font-bold mb-0.5">Invite Friends</span>
                    <span className="block text-xs text-slate-400">Share connection link</span>
                  </div>
                  <button onClick={copyInviteLink} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform">
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>

                {!gameStarted && (
                  <GameSelector 
                    canSelect={isHost} 
                    currentGameId={currentGameId} 
                    games={games} 
                    onSelect={handleSelectGame} 
                  />
                )}

                <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col flex-1 min-h-[400px] shadow-2xl relative">
                  <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center z-10 shrink-0">
                    <h2 className="font-bold text-lg">{ActiveGameConfig.name || "Game"}</h2>
                    {isHost && (
                      <button 
                        onClick={handleToggleGame}
                        className={`px-5 py-2 rounded-xl font-bold text-sm transition-colors ${gameStarted ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 ring-1 ring-emerald-500/50'}`}
                      >
                        {gameStarted ? "End Game" : "Start Game"}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 relative p-4 flex flex-col bg-slate-900/50">
                    <GameComponent 
                      roomId={roomId} 
                      gameState={gameState} 
                      isHost={isHost} 
                      me={me} 
                      players={players} 
                      soundEnabled={soundEnabled}
                    />
                    {!gameStarted && (
                      <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
                        <div className="text-center bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-sm w-full mx-auto shadow-2xl">
                          <div className="text-4xl mb-4">?</div>
                          <h3 className="text-xl font-bold mb-2">Waiting to start</h3>
                          <p className="text-slate-400 text-sm mb-6">
                            {isHost ? "You are the host. Start the game when everyone is ready." : "Waiting for the host to start the game."}
                          </p>
                          {isHost && (
                            <button onClick={handleToggleGame} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-emerald-900/20">
                              Start Playing
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>

               {/* Chat & Scores Sidebar */}
              <div className={`md:col-span-4 flex flex-col gap-6 ${activeTab === 'game' ? 'hidden md:flex' : 'flex'} flex-1`}>
                 {/* Chat Tab View */}
                 <div className={`flex flex-col flex-1 h-full min-h-0 ${activeTab === 'scores' ? 'hidden' : 'flex'}`}>
                   <ChatPanel roomId={roomId} me={me} players={players} soundEnabled={soundEnabled} />
                 </div>
                 
                 {/* Scores Tab View */}
                 <div className={`flex flex-col flex-1 min-h-0 ${activeTab === 'chat' ? 'hidden' : 'flex border border-slate-700 rounded-3xl overflow-hidden'}`}>
                   <Scoreboard players={players} />
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Layout Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 flex items-stretch h-16 px-2 pb-safe">
        {[
          { id: 'game', label: 'Game', icon: '??' },
          { id: 'chat', label: 'Chat', icon: '??' },
          { id: 'scores', label: 'Scores', icon: '??' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
