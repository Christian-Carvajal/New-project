# PlayTogether Hub

PlayTogether Hub is a modular full-stack multiplayer browser game platform where players share a room link, join with usernames, chat live, and switch between multiple synchronized mini-games inside one session.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Real-time sync: Socket.io
- No external APIs

## Features

- Shareable rooms with unique room IDs
- Username-based join and reconnect flow
- Live room chat
- Session scoreboard across games
- Host-controlled game selector
- Light and dark mode
- Sound effects toggle
- Mobile responsive lobby and game layouts
- Modular game system with per-game state, reset logic, and synchronized actions

## Included Games

- Rock Paper Scissors
- Coin Toss
- Dice Roll
- Guess the Number
- Higher or Lower
- Blackjack
- High Card Draw
- Reaction Time
- Number Battle
- Memory Match
- Spin the Wheel
- Truth or Dare

## Folder Structure

```text
PlayTogether Hub/
|-- backend/
|   |-- src/
|   |   |-- games/
|   |   |-- server/
|   |   `-- index.js
|   |-- .env.example
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- games/
|   |   |-- utils/
|   |   |-- App.jsx
|   |   `-- styles.css
|   |-- .env.example
|   |-- index.html
|   `-- package.json
|-- package.json
`-- README.md
```

## Local Setup

1. Install root tooling:

```bash
npm install
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

4. Create environment files:

- Copy `backend/.env.example` to `backend/.env`
- Copy `frontend/.env.example` to `frontend/.env`

5. Start both apps from the repo root:

```bash
npm run dev
```

6. Open the frontend:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:4000/api/health`

## Environment Variables

### Backend

- `PORT`: Express and Socket.io server port
- `CLIENT_URL`: Allowed frontend origin for CORS
- `NODE_ENV`: Standard Node environment value

### Frontend

- `VITE_SERVER_URL`: Socket.io / API server URL

## Production Notes

- The backend serves `frontend/dist` automatically when a production build exists.
- Run `npm --prefix frontend run build` before starting the backend in production.
- Rooms are authoritative on the server, including timers and secret game state.

## Extending the Game System

To add a new game:

1. Create a new backend game file in `backend/src/games/`
2. Export a game definition with:
   - `createInitialState`
   - `onAction`
   - `serialize`
   - optional `onPlayerStatusChanged`
3. Register the game in `backend/src/games/index.js`
4. Add a React game component in `frontend/src/games/`
5. Register the component in `frontend/src/games/index.jsx`

That structure keeps the room platform stable while making new mini-games easy to plug in later.
