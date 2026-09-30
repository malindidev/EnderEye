export const API = Object.freeze({
  java: "https://api.mcsrvstat.us/3/",
  bedrock: "https://api.mcsrvstat.us/bedrock/3/",
  timeoutMs: 12000
});

export const DEFAULT_PORTS = Object.freeze({
  java: 25565,
  bedrock: 19132
});

export const STORAGE_KEY = "enderEye.recent";
export const MAX_RECENT = 6;
export const MAX_PLAYERS_SHOWN = 24;

export const LATENCY_LEVELS = Object.freeze([
  { max: 120, level: "excellent", note: "Excellent" },
  { max: 300, level: "good", note: "Good" },
  { max: 600, level: "fair", note: "Fair" },
  { max: Infinity, level: "poor", note: "Slow" }
]);
