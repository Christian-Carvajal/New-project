import { io } from "socket.io-client";

function resolveServerUrl() {
  const configuredUrl = import.meta.env.VITE_SERVER_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  if (window.location.port === "5173") {
    return "http://localhost:4000";
  }

  return window.location.origin;
}

export const socket = io("https://new-project-o5yz.onrender.com", {
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5
});

export function ensureSocketConnection() {
  if (socket.connected) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleError);
    };

    const handleConnect = () => {
      cleanup();
      resolve();
    };

    const handleError = (error) => {
      cleanup();
      reject(error);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleError);
    socket.connect();
  });
}

export function emitWithAck(eventName, payload) {
  return new Promise((resolve, reject) => {
    socket.timeout(7000).emit(eventName, payload, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (response?.ok === false) {
        reject(new Error(response.error || "Request failed."));
        return;
      }

      resolve(response);
    });
  });
}
