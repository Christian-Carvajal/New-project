import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ChatPanel from "./ChatPanel.jsx";
import GameSelector from "./GameSelector.jsx";
import Scoreboard from "./Scoreboard.jsx";
import { FallbackGame, GAME_COMPONENTS } from "../games/index.jsx";
import { emitWithAck, ensureSocketConnection, socket } from "../utils/socket.js";
import { playUiSound } from "../utils/sound.js";
import { clearRoomSession, getRoomSession, saveRoomSession } from "../utils/storage.js";

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function getThemeClasses(theme) {
  const isLight = theme === "light";

  return {
    shell: isLight ? "bg-slate-100 text-slate-900" : "bg-slate-950 text-slate-100",
    headerSurface: isLight
      ? "bg-white/88 border-slate-200 shadow-[0_18px_44px_rgba(15,23,42,0.08)]"
      : "bg-slate-900/78 border-slate-800 shadow-2xl shadow-slate-950/30",
    panelSurface: isLight
      ? "bg-white/90 border-slate-200 shadow-[0_18px_44px_rgba(15,23,42,0.08)]"
      : "bg-slate-900/78 border-slate-700/70 shadow-2xl shadow-slate-950/30",
    cardSurface: isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/70 border-slate-700/60",
    utilityButton: isLight
      ? "border-slate-300 bg-white/85 text-slate-700 hover:bg-slate-50"
      : "border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-800",
    subtleText: isLight ? "text-slate-600" : "text-slate-400",
    headingText: isLight ? "text-slate-950" : "text-white",
    inputSurface: isLight
      ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
      : "bg-slate-950/70 border-slate-700 text-white placeholder:text-slate-500",
    gameHeaderSurface: isLight ? "bg-slate-50/95 border-slate-200" : "bg-slate-900/85 border-slate-700/70",
    mobileNav: isLight ? "bg-white/92 border-slate-200" : "bg-slate-900/88 border-slate-700/70"
  };
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return true;
    }

    return window.matchMedia("(min-width: 768px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (event) => setIsDesktop(event.matches);

    setIsDesktop(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return isDesktop;
}

function HeaderActionButton({ children, className, ...props }) {
  return (
    <button
      className={cn(
        "rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function SummaryCard({ label, value, hint, classes, action, actionLabel }) {
  return (
    <div className={cn("rounded-3xl border p-4", classes.cardSurface)}>
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-indigo-400">{label}</p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("truncate text-lg font-black", classes.headingText)}>{value}</p>
          {hint ? <p className={cn("mt-1 text-sm", classes.subtleText)}>{hint}</p> : null}
        </div>
        {action && actionLabel ? (
          <button className="rounded-full bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-colors hover:bg-indigo-500" onClick={action} type="button">
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function GameIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path d="M7 10h10a3 3 0 0 1 2.88 3.84l-1.09 3.77A2 2 0 0 1 16.86 19H7.14a2 2 0 0 1-1.93-1.39l-1.09-3.77A3 3 0 0 1 7 10Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M8.5 13.5h2M9.5 12.5v2M15.5 13a.5.5 0 1 0 0 .001M17.5 14.5a.5.5 0 1 0 0 .001M8 10l1-2.5A2 2 0 0 1 10.86 6h2.28A2 2 0 0 1 15 7.5L16 10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ScoreIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path d="M6 4h12v3a6 6 0 0 1-12 0V4Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M8 20h8M12 13v7M4 7H3a2 2 0 0 0 2 2M20 7h1a2 2 0 0 1-2 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path d="M7 17.5 3 20V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2H7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M8 10h8M8 7h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function BottomNav({ activeTab, onChange, unreadChatBadge, classes }) {
  const tabs = [
    { id: "game", label: "Play", icon: <GameIcon /> },
    { id: "scores", label: "Scores", icon: <ScoreIcon /> },
    { id: "chat", label: "Chat", icon: <ChatIcon /> }
  ];

  return (
    <nav className={cn("relative z-20 flex h-16 shrink-0 items-stretch border-t px-2 pb-safe backdrop-blur-xl", classes.mobileNav)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors",
              isActive ? "text-indigo-400" : "text-slate-500"
            )}
            key={tab.id}
            onClick={() => onChange(tab.id)}
            type="button"
          >
            <span className={cn("transition-transform", isActive ? "scale-110" : "")}>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.id === "chat" && unreadChatBadge > 0 ? (
              <span className="absolute right-[26%] top-2 inline-flex min-w-[1.2rem] items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                {unreadChatBadge > 9 ? "9+" : unreadChatBadge}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

export default function RoomPageView({ socketConnected, soundEnabled, theme, onToggleSound, onToggleTheme }) {
  const { roomId: routeRoomId = "" } = useParams();
  const roomId = routeRoomId.toUpperCase();
  const location = useLocation();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const classes = getThemeClasses(theme);

  const [roomState, setRoomState] = useState(null);
  const [joinName, setJoinName] = useState(() => location.state?.preferredUsername || getRoomSession(roomId)?.username || "");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("game");
  const [unreadChatBadge, setUnreadChatBadge] = useState(0);

  const attemptedAutoJoinRef = useRef(false);
  const previousStateRef = useRef(null);
  const copiedTimeoutRef = useRef(null);

  async function joinRoom(username, token) {
    const normalizedUsername = String(username ?? "").trim();

    if (!normalizedUsername) {
      setError("Choose a username before entering the room.");
      return;
    }

    setJoining(true);
    setError("");

    try {
      await ensureSocketConnection();
      const response = await emitWithAck("room:join", {
        roomId,
        username: normalizedUsername,
        playerToken: token
      });

      saveRoomSession(roomId, {
        playerToken: response.playerToken,
        username: normalizedUsername
      });
    } catch (caughtError) {
      if (token) {
        clearRoomSession(roomId);
      }

      setError(caughtError.message || "Unable to join that room.");
    } finally {
      setJoining(false);
    }
  }

  useEffect(() => {
    attemptedAutoJoinRef.current = false;
    setRoomState(null);
    setError("");
    setCopied(false);
    setActiveTab("game");
    setUnreadChatBadge(0);
    setJoinName(location.state?.preferredUsername || getRoomSession(roomId)?.username || "");
  }, [location.state, roomId]);

  useEffect(() => {
    const handleRoomState = (nextState) => {
      if (nextState.roomId === roomId) {
        setRoomState(nextState);
      }
    };

    const handleRoomError = (payload) => {
      setError(payload?.message || payload?.error || "Something went wrong in the room.");
    };

    socket.on("room:state", handleRoomState);
    socket.on("room:error", handleRoomError);

    const storedSession = getRoomSession(roomId);
    const candidateUsername = String(storedSession?.username || location.state?.preferredUsername || "").trim();

    if (!attemptedAutoJoinRef.current && candidateUsername) {
      attemptedAutoJoinRef.current = true;
      joinRoom(candidateUsername, storedSession?.playerToken);
    }

    return () => {
      socket.off("room:state", handleRoomState);
      socket.off("room:error", handleRoomError);
    };
  }, [location.state, roomId]);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!roomState) {
      previousStateRef.current = null;
      return;
    }

    const previousState = previousStateRef.current;

    if (previousState) {
      if (previousState.currentGameId !== roomState.currentGameId) {
        playUiSound("switch", soundEnabled);
      }

      if ((roomState.chat?.length ?? 0) > (previousState.chat?.length ?? 0)) {
        const newestMessage = roomState.chat[roomState.chat.length - 1];

        if (newestMessage?.senderId && newestMessage.senderId !== roomState.selfId) {
          playUiSound("chat", soundEnabled);

          if (activeTab !== "chat") {
            setUnreadChatBadge((currentCount) => currentCount + 1);
          }
        }
      }

      const previousResult = JSON.stringify(previousState.gameState?.result ?? null);
      const currentResult = JSON.stringify(roomState.gameState?.result ?? null);

      if (previousResult !== currentResult && roomState.gameState?.result) {
        const didWin =
          roomState.gameState.result?.winnerId === roomState.selfId ||
          roomState.gameState.result?.winners?.includes?.(roomState.selfId) ||
          roomState.gameState.result?.playerResults?.[roomState.selfId]?.outcome === "win";

        playUiSound(didWin ? "success" : "reveal", soundEnabled);
      }
    }

    previousStateRef.current = roomState;
  }, [activeTab, roomState, soundEnabled]);

  useEffect(() => {
    if (activeTab === "chat") {
      setUnreadChatBadge(0);
    }
  }, [activeTab]);

  async function handleJoinSubmit(event) {
    event.preventDefault();
    await joinRoom(joinName, getRoomSession(roomId)?.playerToken);
  }

  async function handleSelectGame(gameId) {
    try {
      setError("");
      await emitWithAck("game:select", { gameId });
    } catch (caughtError) {
      setError(caughtError.message || "Unable to switch games.");
    }
  }

  async function handleSendChat(text) {
    try {
      setError("");
      await emitWithAck("chat:send", { text });
    } catch (caughtError) {
      setError(caughtError.message || "Unable to send that message.");
      throw caughtError;
    }
  }

  async function handleGameAction(type, payload = {}) {
    try {
      setError("");
      await emitWithAck("game:action", {
        type,
        payload
      });
    } catch (caughtError) {
      setError(caughtError.message || "That move did not go through.");
    }
  }

  async function handleGameReset() {
    try {
      setError("");
      await emitWithAck("game:reset", {});
    } catch (caughtError) {
      setError(caughtError.message || "Unable to reset the game.");
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/New-project/#/room/${roomId}`
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function handleLeaveRoom() {
    try {
      await emitWithAck("room:leave", {});
    } catch {
      // The room may already be unavailable. We still clear local state and return home.
    }

    clearRoomSession(roomId);
    navigate("/");
  }

  if (!roomState?.selfId) {
    return (
      <div className={cn("relative flex min-h-[100dvh] w-full flex-col overflow-hidden", classes.shell)}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[8%] top-[10%] h-80 w-80 rounded-full bg-indigo-600/18 blur-3xl" />
          <div className="absolute bottom-[5%] right-[6%] h-72 w-72 rounded-full bg-emerald-500/14 blur-3xl" />
        </div>

        <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-8 md:px-8">
          <form className={cn("w-full max-w-md rounded-[2rem] border p-6 backdrop-blur-xl md:p-8", classes.panelSurface)} onSubmit={handleJoinSubmit}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-indigo-400">Join Room</p>
                <h1 className={cn("mt-2 text-3xl font-black tracking-tight", classes.headingText)}>{roomId}</h1>
              </div>
              <div
                className={cn(
                  "rounded-full border px-3 py-2 text-xs font-semibold",
                  socketConnected
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-500"
                    : "border-amber-500/25 bg-amber-500/10 text-amber-500"
                )}
              >
                {socketConnected ? "Connected" : "Connecting"}
              </div>
            </div>

            <p className={cn("mt-4 text-sm leading-6", classes.subtleText)}>
              Enter a name to take your seat. If you were already in this room, we will try to reconnect you to the same player slot.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-indigo-400">Username</label>
                <input
                  autoFocus
                  className={cn("w-full rounded-2xl border px-4 py-4 text-base outline-none transition-colors", classes.inputSurface)}
                  maxLength={18}
                  onChange={(event) => setJoinName(event.target.value)}
                  placeholder="Player name"
                  required
                  type="text"
                  value={joinName}
                />
              </div>

              <button className="w-full rounded-2xl bg-indigo-600 px-4 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition-colors hover:bg-indigo-500 disabled:opacity-60" disabled={joining} type="submit">
                {joining ? "Entering room..." : "Enter room"}
              </button>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              <HeaderActionButton className={classes.utilityButton} onClick={onToggleTheme} type="button">
                {theme === "dark" ? "Light theme" : "Dark theme"}
              </HeaderActionButton>
              <HeaderActionButton className={classes.utilityButton} onClick={onToggleSound} type="button">
                Sound {soundEnabled ? "on" : "off"}
              </HeaderActionButton>
            </div>
          </form>
        </main>
      </div>
    );
  }

  const me = roomState.players.find((player) => player.id === roomState.selfId);
  const isHost = roomState.hostId === roomState.selfId;
  const hostPlayer = roomState.players.find((player) => player.id === roomState.hostId);
  const ActiveGame = GAME_COMPONENTS[roomState.currentGameId] ?? FallbackGame;

  const summaryCards = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard action={handleCopyLink} actionLabel={copied ? "Copied" : "Copy"} classes={classes} hint="Share this code or the room URL to invite someone." label="Room" value={roomState.roomId} />
      <SummaryCard classes={classes} hint={isHost ? "You can switch games and reset rounds." : "The host controls game changes and resets."} label="Host" value={hostPlayer?.username || "Waiting"} />
      <SummaryCard classes={classes} hint={roomState.currentGame.description} label="Now Playing" value={roomState.currentGame.name} />
      <SummaryCard classes={classes} hint={socketConnected ? "Your device is synchronized with the room." : "Reconnecting to keep your seat in the room."} label="You" value={me?.username || "Player"} />
    </div>
  );

  const gamePanel = (
    <section className={cn("flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border backdrop-blur-xl", classes.panelSurface)}>
      <div className={cn("flex items-start justify-between gap-4 border-b px-5 py-4", classes.gameHeaderSurface)}>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-400">{roomState.currentGame.category}</p>
          <h2 className={cn("mt-1 text-2xl font-black tracking-tight", classes.headingText)}>{roomState.currentGame.name}</h2>
          <p className={cn("mt-2 text-sm leading-6", classes.subtleText)}>{roomState.currentGame.description}</p>
        </div>
        {isHost ? (
          <button className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors", classes.utilityButton)} onClick={handleGameReset} type="button">
            Reset round
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ActiveGame
          game={roomState.currentGame}
          gameState={roomState.gameState}
          isHost={isHost}
          me={me}
          players={roomState.players}
          room={roomState}
          sendAction={handleGameAction}
        />
      </div>
    </section>
  );

  return (
    <div className={cn("relative flex h-[100dvh] w-full flex-col overflow-hidden font-sans selection:bg-indigo-500/30", classes.shell)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[10%] top-[8%] h-[24rem] w-[24rem] rounded-full bg-indigo-600/16 blur-3xl" />
        <div className="absolute bottom-[6%] right-[8%] h-[26rem] w-[26rem] rounded-full bg-emerald-500/12 blur-3xl" />
      </div>

      <header className={cn("relative z-20 mx-4 mt-4 flex shrink-0 items-center justify-between gap-3 rounded-[1.5rem] border px-4 py-3 backdrop-blur-xl md:mx-6 md:px-5", classes.headerSurface)}>
        <div className="flex items-center gap-3">
          <button className={cn("rounded-full border px-3 py-2 text-xs font-semibold transition-colors", classes.utilityButton)} onClick={handleLeaveRoom} type="button">
            Leave
          </button>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-indigo-400">Room {roomState.roomId}</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  socketConnected ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]" : "bg-amber-500"
                )}
              />
              <h1 className={cn("text-base font-black tracking-tight md:text-lg", classes.headingText)}>PlayTogether Hub</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn("hidden rounded-full border px-3 py-2 text-xs font-semibold lg:inline-flex", socketConnected ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-500" : "border-amber-500/25 bg-amber-500/10 text-amber-500")}>
            {socketConnected ? `${roomState.players.length} players live` : "Reconnecting"}
          </span>
          <HeaderActionButton className={classes.utilityButton} onClick={handleCopyLink} type="button">
            {copied ? "Copied" : "Copy link"}
          </HeaderActionButton>
          <HeaderActionButton className={cn("hidden md:inline-flex", classes.utilityButton)} onClick={onToggleTheme} type="button">
            {theme === "dark" ? "Light theme" : "Dark theme"}
          </HeaderActionButton>
          <HeaderActionButton className={cn("hidden md:inline-flex", classes.utilityButton)} onClick={onToggleSound} type="button">
            Sound {soundEnabled ? "on" : "off"}
          </HeaderActionButton>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-4 md:px-6 md:pb-6">
        {error ? (
          <div className="pointer-events-none absolute left-1/2 top-2 z-30 w-full max-w-md -translate-x-1/2 px-4">
            <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-center text-sm font-semibold text-rose-400 shadow-lg">
              {error}
            </div>
          </div>
        ) : null}

        {isDesktop ? (
          <div className="mx-auto grid h-full w-full max-w-7xl min-h-0 gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
            <div className="min-h-0">
              <Scoreboard meId={roomState.selfId} players={roomState.players} scoreboard={roomState.scoreboard} />
            </div>

            <div className="flex min-h-0 flex-col gap-6 overflow-hidden">
              {summaryCards}
              <GameSelector canSelect={isHost} currentGameId={roomState.currentGameId} games={roomState.games} onSelect={handleSelectGame} theme={theme} />
              {gamePanel}
            </div>

            <div className="min-h-0">
              <ChatPanel disabled={!socketConnected} meId={roomState.selfId} messages={roomState.chat} onSend={handleSendChat} />
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {activeTab === "game" ? (
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4">
                <div className="flex flex-wrap gap-2">
                  <HeaderActionButton className={classes.utilityButton} onClick={onToggleTheme} type="button">
                    {theme === "dark" ? "Light theme" : "Dark theme"}
                  </HeaderActionButton>
                  <HeaderActionButton className={classes.utilityButton} onClick={onToggleSound} type="button">
                    Sound {soundEnabled ? "on" : "off"}
                  </HeaderActionButton>
                </div>
                {summaryCards}
                <GameSelector canSelect={isHost} currentGameId={roomState.currentGameId} games={roomState.games} onSelect={handleSelectGame} theme={theme} />
                {gamePanel}
              </div>
            ) : null}

            {activeTab === "scores" ? (
              <div className="min-h-0 flex-1 overflow-hidden pb-4">
                <Scoreboard meId={roomState.selfId} players={roomState.players} scoreboard={roomState.scoreboard} />
              </div>
            ) : null}

            {activeTab === "chat" ? (
              <div className="min-h-0 flex-1 overflow-hidden pb-4">
                <ChatPanel disabled={!socketConnected} meId={roomState.selfId} messages={roomState.chat} onSend={handleSendChat} />
              </div>
            ) : null}
          </div>
        )}
      </div>

      {!isDesktop ? <BottomNav activeTab={activeTab} classes={classes} onChange={setActiveTab} unreadChatBadge={unreadChatBadge} /> : null}
    </div>
  );
}
