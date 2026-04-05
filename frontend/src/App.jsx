import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import LandingPageView from "./components/LandingPageView.jsx";
import RoomPageView from "./components/RoomPageView.jsx";
import { ensureSocketConnection, socket } from "./utils/socket.js";
import { getSetting, saveSetting } from "./utils/storage.js";

export default function App() {
  const [theme, setTheme] = useState(() => getSetting("theme", "dark"));
  const [soundEnabled, setSoundEnabled] = useState(() => getSetting("soundEnabled", true));
  const [socketConnected, setSocketConnected] = useState(socket.connected);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveSetting("theme", theme);
  }, [theme]);

  useEffect(() => {
    saveSetting("soundEnabled", soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    ensureSocketConnection().catch(() => {
      setSocketConnected(false);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPageView
            socketConnected={socketConnected}
            soundEnabled={soundEnabled}
            theme={theme}
            onToggleSound={() => setSoundEnabled((currentValue) => !currentValue)}
            onToggleTheme={() => setTheme((currentValue) => (currentValue === "dark" ? "light" : "dark"))}
          />
        }
      />
      <Route
        path="/room/:roomId"
        element={
          <RoomPageView
            socketConnected={socketConnected}
            soundEnabled={soundEnabled}
            theme={theme}
            onToggleSound={() => setSoundEnabled((currentValue) => !currentValue)}
            onToggleTheme={() => setTheme((currentValue) => (currentValue === "dark" ? "light" : "dark"))}
          />
        }
      />
    </Routes>
  );
}
