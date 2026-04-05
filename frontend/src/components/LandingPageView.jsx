import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { emitWithAck, ensureSocketConnection } from "../utils/socket.js";
import { saveRoomSession } from "../utils/storage.js";

const FEATURE_GROUPS = [
  {
    title: "Friction-Free Join",
    text: "Room links and 6-character room codes keep entry simple, even for players who are reconnecting."
  },
  {
    title: "Consistent Controls",
    text: "Chat, scores, and game actions stay in familiar places so people can focus on play instead of relearning the interface."
  },
  {
    title: "Live Shared State",
    text: "Every mini-game, prompt, and score update is synchronized for the whole room in real time."
  }
];

function getThemeClasses(theme) {
  const isLight = theme === "light";

  return {
    shell: isLight ? "bg-slate-100 text-slate-900" : "bg-slate-950 text-slate-100",
    heroSurface: isLight
      ? "bg-white/88 border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
      : "bg-slate-900/72 border-slate-800 shadow-2xl shadow-slate-950/30",
    panelSurface: isLight
      ? "bg-white/92 border-slate-200 shadow-[0_18px_48px_rgba(15,23,42,0.06)]"
      : "bg-slate-900/78 border-slate-700/70 shadow-2xl shadow-slate-950/30",
    cardSurface: isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/70 border-slate-700/60",
    inputSurface: isLight
      ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
      : "bg-slate-950/70 border-slate-700 text-white placeholder:text-slate-500",
    subtleText: isLight ? "text-slate-600" : "text-slate-400",
    headingText: isLight ? "text-slate-950" : "text-white",
    utilityButton: isLight
      ? "border-slate-300 bg-white/85 text-slate-700 hover:bg-slate-50"
      : "border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-800",
    secondaryButton: isLight
      ? "border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200"
      : "border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
  };
}

export default function LandingPageView({ socketConnected, soundEnabled, theme, onToggleSound, onToggleTheme }) {
  const navigate = useNavigate();
  const [createUsername, setCreateUsername] = useState("");
  const [joinUsername, setJoinUsername] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("home");
  const classes = getThemeClasses(theme);

  async function handleCreateRoom(event) {
    event.preventDefault();

    if (!createUsername.trim()) {
      setError("Please enter a username.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const normalizedUsername = createUsername.trim();
      await ensureSocketConnection();
      const response = await emitWithAck("room:create", { username: normalizedUsername });
      saveRoomSession(response.roomId, { playerToken: response.playerToken, username: normalizedUsername });
      navigate(`/room/${response.roomId}`);
    } catch (caughtError) {
      setError(caughtError.message || "Unable to create a room right now.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleJoinRoom(event) {
    event.preventDefault();
    setError("");

    if (!joinRoomId.trim()) {
      setError("Enter a room ID.");
      return;
    }

    if (!joinUsername.trim()) {
      setError("Enter a username to play.");
      return;
    }

    navigate(`/room/${joinRoomId.trim().toUpperCase()}`, {
      state: { preferredUsername: joinUsername.trim() }
    });
  }

  return (
    <div className={`relative flex min-h-[100dvh] w-full flex-col overflow-hidden pb-safe font-sans selection:bg-indigo-500/30 ${classes.shell}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[8%] h-80 w-80 rounded-full bg-indigo-600/18 blur-3xl" />
        <div className="absolute -bottom-[14%] -right-[6%] h-80 w-80 rounded-full bg-emerald-500/14 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-6 md:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-black tracking-[0.25em] text-white shadow-lg shadow-indigo-500/30">
            PT
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-indigo-400">PlayTogether Hub</p>
            <p className={`text-sm ${classes.subtleText}`}>One shared room for chat, scores, and mini-games.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`hidden rounded-full border px-3 py-2 text-xs font-semibold sm:inline-flex ${
              socketConnected
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-500"
                : "border-amber-500/25 bg-amber-500/10 text-amber-500"
            }`}
          >
            {socketConnected ? "Server ready" : "Connecting"}
          </span>
          <button className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${classes.utilityButton}`} onClick={onToggleTheme} type="button">
            {theme === "dark" ? "Light theme" : "Dark theme"}
          </button>
          <button className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${classes.utilityButton}`} onClick={onToggleSound} type="button">
            Sound {soundEnabled ? "on" : "off"}
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 overflow-y-auto px-5 pb-8 pt-6 md:px-8 md:pb-10 md:pt-8">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className={`rounded-[2rem] border p-6 backdrop-blur-xl md:p-8 ${classes.heroSurface}`}>
            <span className="inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-indigo-400">
              User-Centered Multiplayer
            </span>
            <h1 className={`mt-5 text-4xl font-black tracking-tight md:text-5xl ${classes.headingText}`}>
              Start the room quickly, keep every game easy to read, and help players stay oriented at every step.
            </h1>
            <p className={`mt-4 max-w-2xl text-base leading-7 ${classes.subtleText}`}>
              Create or join once, then move through synchronized mini-games with one consistent interface. Clear labels, live status, and shared feedback keep the room focused on play instead of setup.
            </p>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {FEATURE_GROUPS.map((feature) => (
                <article className={`rounded-3xl border p-4 ${classes.cardSurface}`} key={feature.title}>
                  <h2 className={`text-base font-bold ${classes.headingText}`}>{feature.title}</h2>
                  <p className={`mt-2 text-sm leading-6 ${classes.subtleText}`}>{feature.text}</p>
                </article>
              ))}
            </div>

            <div className={`mt-8 rounded-3xl border p-5 ${classes.cardSurface}`}>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-400">How it works</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div>
                  <strong className={classes.headingText}>1. Create or join</strong>
                  <p className={`mt-1 text-sm ${classes.subtleText}`}>Use a name and a 6-character room code or shared room link.</p>
                </div>
                <div>
                  <strong className={classes.headingText}>2. Stay in one room</strong>
                  <p className={`mt-1 text-sm ${classes.subtleText}`}>Scores, chat, and game changes all happen without changing screens.</p>
                </div>
                <div>
                  <strong className={classes.headingText}>3. Keep momentum</strong>
                  <p className={`mt-1 text-sm ${classes.subtleText}`}>Hosts can move the room forward while everyone sees the same result at once.</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-[2rem] border p-6 backdrop-blur-xl md:p-8 ${classes.panelSurface}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-indigo-400">Room Access</span>
                <h2 className={`mt-2 text-2xl font-black tracking-tight ${classes.headingText}`}>
                  {mode === "home" ? "Choose your next step" : mode === "create" ? "Host a new room" : "Join an existing room"}
                </h2>
              </div>
              {mode !== "home" ? (
                <button className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${classes.utilityButton}`} onClick={() => setMode("home")} type="button">
                  Back
                </button>
              ) : null}
            </div>

            <p className={`mt-3 text-sm leading-6 ${classes.subtleText}`}>
              {mode === "home"
                ? "Pick the flow that matches your goal. Each path keeps forms short and the next action obvious."
                : mode === "create"
                  ? "Create a room, get a shareable link instantly, and start as host."
                  : "Enter the room code and your name. We will carry your name into the room automatically."}
            </p>

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400">
                {error}
              </div>
            ) : null}

            {mode === "home" ? (
              <div className="mt-8 space-y-3">
                <button
                  className="w-full rounded-3xl bg-indigo-600 px-5 py-4 text-left text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 active:scale-[0.99]"
                  onClick={() => setMode("create")}
                  type="button"
                >
                  <span className="block text-xs font-bold uppercase tracking-[0.22em] text-indigo-100">Host</span>
                  <span className="mt-2 block text-xl font-black">Create a room</span>
                  <span className="mt-1 block text-sm text-indigo-100">You choose the games and can reset rounds for the group.</span>
                </button>

                <button
                  className={`w-full rounded-3xl border px-5 py-4 text-left transition-colors ${classes.secondaryButton}`}
                  onClick={() => setMode("join")}
                  type="button"
                >
                  <span className="block text-xs font-bold uppercase tracking-[0.22em] text-indigo-400">Join</span>
                  <span className="mt-2 block text-xl font-black">Enter a room code</span>
                  <span className={`mt-1 block text-sm ${classes.subtleText}`}>Bring your username and jump straight into the shared room.</span>
                </button>
              </div>
            ) : null}

            {mode === "create" ? (
              <form className="mt-8 space-y-5" onSubmit={handleCreateRoom}>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-indigo-400">Username</label>
                  <input
                    autoFocus
                    className={`w-full rounded-2xl border px-4 py-4 text-base outline-none transition-colors ${classes.inputSurface}`}
                    maxLength={18}
                    onChange={(event) => setCreateUsername(event.target.value)}
                    placeholder="Host name"
                    required
                    type="text"
                    value={createUsername}
                  />
                </div>
                <button className="w-full rounded-2xl bg-indigo-600 px-4 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition-colors hover:bg-indigo-500 disabled:opacity-60" disabled={submitting} type="submit">
                  {submitting ? "Creating room..." : "Create room"}
                </button>
              </form>
            ) : null}

            {mode === "join" ? (
              <form className="mt-8 space-y-5" onSubmit={handleJoinRoom}>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-indigo-400">Room code</label>
                  <input
                    autoFocus
                    className={`w-full rounded-2xl border px-4 py-4 text-center font-mono text-2xl font-bold uppercase tracking-[0.35em] outline-none transition-colors ${classes.inputSurface}`}
                    maxLength={6}
                    onChange={(event) => setJoinRoomId(event.target.value.replace(/\s+/g, "").toUpperCase())}
                    placeholder="ABC123"
                    required
                    type="text"
                    value={joinRoomId}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-indigo-400">Username</label>
                  <input
                    className={`w-full rounded-2xl border px-4 py-4 text-base outline-none transition-colors ${classes.inputSurface}`}
                    maxLength={18}
                    onChange={(event) => setJoinUsername(event.target.value)}
                    placeholder="Player name"
                    required
                    type="text"
                    value={joinUsername}
                  />
                </div>
                <button className="w-full rounded-2xl bg-indigo-600 px-4 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition-colors hover:bg-indigo-500" type="submit">
                  Join room
                </button>
              </form>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
