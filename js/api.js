import { API, DEFAULT_PORTS, LATENCY_LEVELS } from "./config.js";
import { AppError } from "./errors.js";

function classifyLatency(ms) {
  return LATENCY_LEVELS.find((entry) => ms <= entry.max);
}

function toLines(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split("\n");
  return [];
}

function normalize(data, edition, address, latencyMs) {
  const online = Boolean(data && data.online);
  const port = Number(data.port) || DEFAULT_PORTS[edition];
  const host = data.hostname || data.ip || address.replace(/:\d+$/, "");
  const shownAddress = port === DEFAULT_PORTS[edition] ? host : `${host}:${port}`;
  const players = data.players || {};
  const playerList = Array.isArray(players.list)
    ? players.list.map((entry) => (typeof entry === "string" ? entry : entry.name)).filter(Boolean)
    : [];
  const motd = data.motd || {};
  const latency = classifyLatency(latencyMs);

  return {
    online,
    edition,
    query: address,
    host,
    address: shownAddress,
    icon: typeof data.icon === "string" && data.icon.startsWith("data:image/") ? data.icon : null,
    version: data.version || (data.protocol && data.protocol.name) || "Unknown",
    software: data.software || "",
    protocol: data.protocol && data.protocol.version ? String(data.protocol.version) : "",
    players: {
      online: Number(players.online) || 0,
      max: Number(players.max) || 0,
      list: playerList
    },
    motd: {
      raw: toLines(motd.raw),
      clean: toLines(motd.clean)
    },
    latency: { ms: latencyMs, level: latency.level, note: latency.note },
    checkedAt: new Date()
  };
}

export async function fetchStatus(address, edition, externalSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), API.timeoutMs);
  const onExternalAbort = () => controller.abort("cancelled");
  externalSignal?.addEventListener("abort", onExternalAbort, { once: true });

  const started = performance.now();

  try {
    const response = await fetch(API[edition] + encodeURIComponent(address), {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });
    const latencyMs = Math.max(1, Math.round(performance.now() - started));

    if (response.status === 429) {
      throw new AppError("Rate limited", "Too many requests were sent to the status service. Please wait a moment and try again.");
    }

    if (!response.ok) {
      throw new AppError("Service unavailable", `The status service responded with an error (${response.status}). Please try again shortly.`);
    }

    const data = await response.json();
    return normalize(data, edition, address, latencyMs);
  } catch (error) {
    if (error instanceof AppError) throw error;

    if (error.name === "AbortError" || controller.signal.aborted) {
      if (controller.signal.reason === "cancelled") throw error;
      throw new AppError("Request timed out", "The status service took too long to respond. Please try again.");
    }

    throw new AppError("Connection problem", "Could not reach the status service. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}
