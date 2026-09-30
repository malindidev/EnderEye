export const DEFAULT_PORTS = Object.freeze({
  java: 25565,
  bedrock: 19132
});

export const REQUEST_TIMEOUT_MS = 8000;
export const STORAGE_KEY = "enderEye.recent";
export const THEME_KEY = "enderEye.theme";
export const MAX_RECENT = 6;
export const MAX_PLAYERS_SHOWN = 24;

export const LATENCY_LEVELS = Object.freeze([
  { max: 120, level: "excellent", note: "Excellent" },
  { max: 300, level: "good", note: "Good" },
  { max: 600, level: "fair", note: "Fair" },
  { max: Infinity, level: "poor", note: "Slow" }
]);
