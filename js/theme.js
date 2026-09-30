import { THEME_KEY } from "./config.js";

const root = document.documentElement;
const media = window.matchMedia("(prefers-color-scheme: dark)");
const COLORS = { dark: "#0f1115", light: "#f5f6f8" };

function readStored() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function writeStored(value) {
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {
    return;
  }
}

function apply(theme, button) {
  root.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", COLORS[theme]);
  button.setAttribute("aria-pressed", String(theme === "dark"));
  button.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
}

export function initTheme(button) {
  apply(readStored() || (media.matches ? "dark" : "light"), button);

  button.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    apply(next, button);
    writeStored(next);
  });

  media.addEventListener("change", (event) => {
    if (!readStored()) apply(event.matches ? "dark" : "light", button);
  });
}
