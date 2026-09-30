import { REQUEST_TIMEOUT_MS, DEFAULT_PORTS, LATENCY_LEVELS } from "./config.js";
import { AppError } from "./errors.js";
import { PROVIDERS } from "./providers.js";

class ProviderError extends Error {
  constructor(kind, status = 0) {
    super(kind);
    this.kind = kind;
    this.status = status;
  }
}

function classifyLatency(ms) {
  return LATENCY_LEVELS.find((entry) => ms <= entry.max);
}

function cancelledError() {
  return new DOMException("Request cancelled", "AbortError");
}

async function requestProvider(provider, address, edition, externalSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort("cancelled");
  externalSignal?.addEventListener("abort", onExternalAbort, { once: true });

  const started = performance.now();

  try {
    const response = await fetch(provider.url(address, edition), {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });
    const latencyMs = Math.max(1, Math.round(performance.now() - started));

    if (!response.ok) {
      throw new ProviderError(response.status === 429 ? "rate" : "http", response.status);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new ProviderError("parse");
    }

    let parsed;
    try {
      parsed = provider.parse(data);
    } catch {
      throw new ProviderError("parse");
    }

    return { parsed, latencyMs };
  } catch (error) {
    if (error instanceof ProviderError) throw error;

    if (controller.signal.aborted) {
      if (controller.signal.reason === "cancelled") throw cancelledError();
      throw new ProviderError("timeout");
    }

    throw new ProviderError("network");
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

function normalize(parsed, providerId, edition, address, latencyMs) {
  const fallbackHost = address.replace(/:\d+$/, "");
  const host = parsed.host || fallbackHost;
  const port = parsed.port || DEFAULT_PORTS[edition];
  const shownAddress = port === DEFAULT_PORTS[edition] ? host : `${host}:${port}`;
  const latency = classifyLatency(latencyMs);

  return {
    online: parsed.online,
    edition,
    query: address,
    provider: providerId,
    host,
    address: shownAddress,
    icon: typeof parsed.icon === "string" && parsed.icon.startsWith("data:image/") ? parsed.icon : null,
    version: parsed.version || "Unknown",
    software: parsed.software,
    protocol: parsed.protocol,
    players: parsed.players,
    motd: { raw: parsed.motdRaw, clean: parsed.motdClean },
    latency: { ms: latencyMs, level: latency.level, note: latency.note },
    checkedAt: new Date()
  };
}

function buildFailure(failures) {
  if (failures.some((failure) => failure.kind === "rate")) {
    return new AppError("Rate limited", "The status services are limiting requests right now. Please wait a minute and try again.");
  }

  if (failures.length && failures.every((failure) => failure.kind === "network" || failure.kind === "timeout")) {
    return new AppError("Connection problem", "Could not reach any status service. Check your connection, or whether a network filter or extension is blocking them.");
  }

  return new AppError("Services unavailable", "None of the status services returned a usable response. Please try again shortly.");
}

export async function fetchStatus(address, edition, signal) {
  const failures = [];

  for (const provider of PROVIDERS) {
    if (signal?.aborted) throw cancelledError();

    try {
      const { parsed, latencyMs } = await requestProvider(provider, address, edition, signal);
      return normalize(parsed, provider.id, edition, address, latencyMs);
    } catch (error) {
      if (error.name === "AbortError") throw error;
      failures.push(error);
    }
  }

  throw buildFailure(failures);
}
