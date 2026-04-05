import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { emitWithAck, ensureSocketConnection } from "../utils/socket.js";
import { saveRoomSession } from "../utils/storage.js";

export default function LandingPage({ socketConnected, error: globalError }) {
  const navigate = useNavigate();
  const [createUsername, setCreateUsername] = useState("");
  const [joinUsername, setJoinUsername] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("home");

  async function handleCreateRoom(e) {
    e.preventDefault();
    if (!createUsername.trim()) return setError("Please enter a username.");
    setSubmitting(true);
    setError("");
    try {
      await ensureSocketConnection();
      const res = await emitWithAck("room:create", { username: createUsername });
      saveRoomSession(res.roomId, { playerToken: res.playerToken, username: createUsername.trim() });
      navigate(`/room/${res.roomId}`);
    } catch (err) {
      setError(err.message || "Unable to create room.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleJoinRoom(e) {
    e.preventDefault();
    setError("");
    if (!joinRoomId.trim()) return setError("Enter a room ID.");
    if (!joinUsername.trim()) return setError("Enter a username.");
    navigate(`/room/${joinRoomId.trim().toUpperCase()}`, {
      state: { preferredUsername: joinUsername.trim() }
    });
  }

  return (
    <div className="min-h-[100dvh] bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
      <main className="w-full max-w-sm flex flex-col gap-6">
        {mode === "home" && (
          <div className="text-center">
            <div className="text-6xl mb-4">??</div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">PlayTogether</h1>
            <p className="text-slate-400 mb-6">Real-time games with friends.</p>
            {!socketConnected && <div className="text-xs text-red-300 bg-red-900/40 py-1.5 px-3 rounded-full inline-block">Connecting to server...</div>}
          </div>
        )}

        {(error || globalError) && (
          <div className="bg-red-900/40 text-red-200 border border-red-800 p-3 rounded-xl text-center text-sm font-medium">
            {error || globalError}
          </div>
        )}

        {mode === "home" && (
           <div className="flex flex-col gap-3">
              <button onClick={() => setMode("create")} className="bg-indigo-600 active:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl transition-colors text-lg">Start Room</button>
              <button onClick={() => setMode("join")} className="bg-slate-800 border border-slate-700 active:bg-slate-700 text-white font-bold py-4 px-6 rounded-2xl transition-colors text-lg">Join Room</button>
           </div>
        )}

        {mode === "create" && (
          <form onSubmit={handleCreateRoom} className="flex flex-col gap-4 bg-slate-800 p-6 rounded-3xl border border-slate-700">
            <h2 className="font-bold text-xl mb-1">New Room</h2>
            <input type="text" required maxLength={18} autoFocus onChange={(e) => setCreateUsername(e.target.value)} value={createUsername} className="bg-slate-900 border border-slate-700 rounded-xl p-3.5 outline-none focus:border-indigo-500 font-medium" placeholder="Your Name" />
            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setMode("home")} className="flex-1 bg-slate-700 text-slate-300 rounded-xl font-bold">Back</button>
              <button type="submit" disabled={submitting} className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50">{submitting ? "..." : "Create"}</button>
            </div>
          </form>
        )}

        {mode === "join" && (
          <form onSubmit={handleJoinRoom} className="flex flex-col gap-4 bg-slate-800 p-6 rounded-3xl border border-slate-700">
            <h2 className="font-bold text-xl mb-1">Join Room</h2>
            <input type="text" required maxLength={6} autoFocus onChange={(e) => setJoinRoomId(e.target.value.replace(/\s+/g, "").toUpperCase())} value={joinRoomId} className="bg-slate-900 border border-slate-700 rounded-xl p-3.5 outline-none focus:border-indigo-500 font-mono text-center uppercase tracking-widest text-xl font-bold" placeholder="CODE" />
            <input type="text" required maxLength={18} onChange={(e) => setJoinUsername(e.target.value)} value={joinUsername} className="bg-slate-900 border border-slate-700 rounded-xl p-3.5 outline-none focus:border-indigo-500 font-medium" placeholder="Your Name" />
             <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setMode("home")} className="flex-1 bg-slate-700 text-slate-300 rounded-xl font-bold">Back</button>
              <button type="submit" className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-xl font-bold">Join</button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
