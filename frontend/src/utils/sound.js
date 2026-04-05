let audioContext = null;

function getAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = AudioContextClass ? new AudioContextClass() : null;
  }

  return audioContext;
}

function scheduleTone(context, startAt, frequency, duration, gainValue, type) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(gainValue, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration);
}

export function playUiSound(kind, enabled) {
  if (!enabled) {
    return;
  }

  const context = getAudioContext();

  if (!context) {
    return;
  }

  const now = context.currentTime + 0.01;

  if (kind === "success") {
    scheduleTone(context, now, 440, 0.14, 0.025, "triangle");
    scheduleTone(context, now + 0.1, 660, 0.16, 0.02, "triangle");
    return;
  }

  if (kind === "reveal") {
    scheduleTone(context, now, 280, 0.2, 0.018, "sine");
    scheduleTone(context, now + 0.14, 520, 0.2, 0.015, "sine");
    return;
  }

  if (kind === "chat") {
    scheduleTone(context, now, 720, 0.08, 0.012, "square");
    return;
  }

  if (kind === "switch") {
    scheduleTone(context, now, 360, 0.08, 0.016, "triangle");
    scheduleTone(context, now + 0.07, 500, 0.08, 0.014, "triangle");
  }
}
