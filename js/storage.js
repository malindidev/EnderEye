import { STORAGE_KEY, MAX_RECENT } from "./config.js";

export function loadRecent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.address && item.edition) : [];
  } catch {
    return [];
  }
}

export function saveRecent(address, edition) {
  const next = [
    { address, edition },
    ...loadRecent().filter((item) => !(item.address === address && item.edition === edition))
  ].slice(0, MAX_RECENT);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return next;
  }
  return next;
}

export function clearRecent() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}
