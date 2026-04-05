import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./server/socketHandlers.js";

const PORT = Number(process.env.PORT || 4000);
const CLIENT_URL = process.env.CLIENT_URL || "";
const allowedOrigins = CLIENT_URL
  ? CLIENT_URL.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : "*";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "playtogether-hub",
    timestamp: Date.now()
  });
});

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api")) {
      next();
      return;
    }

    response.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

registerSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`PlayTogether Hub server running on http://localhost:${PORT}`);
});
