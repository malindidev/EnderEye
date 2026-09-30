import { AppError } from "./errors.js";

const HOST_PATTERN = /^(?:\[[0-9a-fA-F:]+\]|[a-zA-Z0-9]([a-zA-Z0-9_-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9]([a-zA-Z0-9_-]*[a-zA-Z0-9])?)*)(?::\d{1,5})?$/;

export function normalizeAddress(raw) {
  const cleaned = String(raw || "")
    .trim()
    .replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

  if (!cleaned) {
    throw new AppError("Address required", "Enter a server address or IP to check.");
  }

  if (cleaned.length > 255 || !HOST_PATTERN.test(cleaned)) {
    throw new AppError("Invalid address", "That does not look like a valid server address. Try something like play.example.net or 192.0.2.1:25565.");
  }

  const portMatch = cleaned.match(/:(\d{1,5})$/);
  if (portMatch && Number(portMatch[1]) > 65535) {
    throw new AppError("Invalid port", "Ports must be between 1 and 65535.");
  }

  return cleaned;
}
