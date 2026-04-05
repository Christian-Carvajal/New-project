import { pickRandom } from "./gameUtils.js";

const TRUTHS = [
  "What is the most surprising thing on your bucket list?",
  "What habit are you trying hardest to break?",
  "What is a skill you wish you had right now?",
  "What is the funniest excuse you have ever used?",
  "What was your first online username?",
  "What is one food opinion you defend every time?",
  "What game always makes you too competitive?",
  "What is your go-to comfort movie?",
  "What is the last thing you changed your mind about?",
  "What is a tiny win from this week?"
];

const DARES = [
  "Talk like a sports commentator for the next minute.",
  "Invent a victory speech for a game you did not win.",
  "Describe your favorite snack like it is a luxury product.",
  "Do your best dramatic villain laugh right now.",
  "Spell your name backwards without slowing down.",
  "Give the room your best fake weather report.",
  "Pitch a terrible sequel to your favorite movie.",
  "Pretend you are a game show host until the next turn.",
  "Make up a slogan for the room in five seconds.",
  "Name three animals as if they are band members."
];

export default {
  id: "truthOrDare",
  name: "Truth or Dare",
  description: "Generate quick conversation prompts without leaving the room.",
  category: "Fun",
  minPlayers: 2,
  maxPlayers: 16,
  accent: "bubblegum",
  createInitialState() {
    return {
      lastPrompt: null,
      history: []
    };
  },
  onAction({ room, playerId, action }) {
    if (action.type === "reset") {
      room.gameState = {
        lastPrompt: null,
        history: []
      };
      return;
    }

    if (action.type !== "generate") {
      return;
    }

    const requestedMode = action.payload?.mode;
    const mode = requestedMode === "truth" || requestedMode === "dare" ? requestedMode : Math.random() > 0.5 ? "truth" : "dare";
    const prompt = {
      type: mode,
      text: mode === "truth" ? pickRandom(TRUTHS) : pickRandom(DARES),
      requestedBy: playerId,
      timestamp: Date.now()
    };

    room.gameState.lastPrompt = prompt;
    room.gameState.history = [prompt, ...room.gameState.history].slice(0, 10);
  },
  serialize({ room }) {
    return room.gameState;
  }
};
