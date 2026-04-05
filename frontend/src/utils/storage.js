const ROOM_SESSIONS_KEY = "playTogetherHub:roomSessions";
const SETTINGS_KEY = "playTogetherHub:settings";

function readJson(key, fallbackValue) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getRoomSession(roomId) {
  const sessions = readJson(ROOM_SESSIONS_KEY, {});
  return sessions[String(roomId).toUpperCase()] ?? null;
}

export function saveRoomSession(roomId, session) {
  const sessions = readJson(ROOM_SESSIONS_KEY, {});
  sessions[String(roomId).toUpperCase()] = session;
  writeJson(ROOM_SESSIONS_KEY, sessions);
}

export function clearRoomSession(roomId) {
  const sessions = readJson(ROOM_SESSIONS_KEY, {});
  delete sessions[String(roomId).toUpperCase()];
  writeJson(ROOM_SESSIONS_KEY, sessions);
}

export function getSetting(name, fallbackValue) {
  const settings = readJson(SETTINGS_KEY, {});
  return settings[name] ?? fallbackValue;
}

export function saveSetting(name, value) {
  const settings = readJson(SETTINGS_KEY, {});
  settings[name] = value;
  writeJson(SETTINGS_KEY, settings);
}
