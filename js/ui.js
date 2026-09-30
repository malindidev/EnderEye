import { MAX_PLAYERS_SHOWN } from "./config.js";
import { renderMotd } from "./motd.js";

const $ = (id) => document.getElementById(id);

export const els = {
  form: $("search-form"),
  input: $("address"),
  submit: $("submit-btn"),
  recent: $("recent"),
  recentList: $("recent-list"),
  recentClear: $("recent-clear"),
  loading: $("loading"),
  error: $("error"),
  errorTitle: $("error-title"),
  errorMessage: $("error-message"),
  errorRetry: $("error-retry"),
  status: $("status"),
  icon: $("server-icon"),
  iconFallback: $("server-icon-fallback"),
  host: $("server-host"),
  badge: $("status-badge"),
  statusText: $("status-text"),
  address: $("server-address"),
  copy: $("copy-btn"),
  copyLabel: document.querySelector("#copy-btn .copy-label"),
  refresh: $("refresh-btn"),
  playersOnline: $("players-online"),
  playersMax: $("players-max"),
  playersMeter: $("players-meter"),
  latencyValue: $("latency-value"),
  latencyBars: $("latency-bars"),
  latencyNote: $("latency-note"),
  version: $("version-value"),
  protocol: $("protocol-note"),
  motd: $("motd"),
  playerSection: $("player-section"),
  playerList: $("player-list"),
  editionTag: $("edition-tag"),
  checkedAt: $("checked-at"),
  toast: $("toast")
};

const panels = ["loading", "error", "status"];
let toastTimer = 0;
let copyTimer = 0;

export function showPanel(name) {
  panels.forEach((panel) => {
    els[panel].hidden = panel !== name;
  });
}

export function setBusy(isBusy) {
  els.submit.disabled = isBusy;
  els.submit.classList.toggle("is-loading", isBusy);
  els.submit.setAttribute("aria-busy", String(isBusy));
  els.refresh.classList.toggle("is-spinning", isBusy);
}

export function showLoading() {
  showPanel("loading");
  setBusy(true);
}

export function showError(title, message) {
  els.errorTitle.textContent = title;
  els.errorMessage.textContent = message;
  showPanel("error");
  setBusy(false);
}

export function flagInvalidInput() {
  els.input.classList.remove("invalid");
  void els.input.offsetWidth;
  els.input.classList.add("invalid");
  els.input.focus();
}

export function clearInvalidInput() {
  els.input.classList.remove("invalid");
}

export function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

export function flashCopied(success) {
  clearTimeout(copyTimer);
  els.copy.classList.toggle("copied", success);
  els.copyLabel.textContent = success ? "Copied" : "Failed";
  showToast(success ? "Server address copied to clipboard" : "Copy failed. Select the address manually.");
  copyTimer = setTimeout(() => {
    els.copy.classList.remove("copied");
    els.copyLabel.textContent = "Copy";
  }, 1800);
}

function renderIcon(icon) {
  if (icon) {
    els.icon.src = icon;
    els.icon.hidden = false;
    els.iconFallback.hidden = true;
  } else {
    els.icon.removeAttribute("src");
    els.icon.hidden = true;
    els.iconFallback.hidden = false;
  }
}

function renderPlayers(result) {
  const { online, max, list } = result.players;
  els.playersOnline.textContent = online.toLocaleString();
  els.playersMax.textContent = max.toLocaleString();

  const ratio = max > 0 ? Math.min(100, (online / max) * 100) : 0;
  requestAnimationFrame(() => {
    els.playersMeter.style.width = `${ratio}%`;
  });

  els.playerList.replaceChildren();
  els.playerSection.hidden = list.length === 0;

  const fragment = document.createDocumentFragment();
  list.slice(0, MAX_PLAYERS_SHOWN).forEach((name) => {
    const item = document.createElement("li");
    item.textContent = name;
    fragment.appendChild(item);
  });

  if (list.length > MAX_PLAYERS_SHOWN) {
    const more = document.createElement("li");
    more.className = "more";
    more.textContent = `+${list.length - MAX_PLAYERS_SHOWN} more`;
    fragment.appendChild(more);
  }

  els.playerList.appendChild(fragment);
}

export function renderStatus(result) {
  els.status.dataset.state = result.online ? "online" : "offline";
  els.host.textContent = result.host;
  els.address.textContent = result.address;
  els.badge.className = `badge ${result.online ? "online" : "offline"}`;
  els.statusText.textContent = result.online ? "Online" : "Offline";
  els.editionTag.textContent = result.edition === "bedrock" ? "Bedrock Edition" : "Java Edition";
  els.checkedAt.textContent = `Checked at ${result.checkedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;

  renderIcon(result.online ? result.icon : null);

  if (result.online) {
    renderPlayers(result);
    els.latencyValue.textContent = result.latency.ms.toLocaleString();
    els.latencyBars.dataset.level = result.latency.level;
    els.latencyNote.textContent = `${result.latency.note}, measured to the status service`;
    els.version.textContent = result.version;
    els.protocol.textContent = [result.software, result.protocol ? `Protocol ${result.protocol}` : ""].filter(Boolean).join(" | ");
    renderMotd(els.motd, result.motd);
  } else {
    renderPlayers({ players: { online: 0, max: 0, list: [] } });
    els.latencyValue.textContent = "0";
    els.latencyBars.dataset.level = "none";
    els.latencyNote.textContent = "No response from server";
    els.version.textContent = "Unavailable";
    els.protocol.textContent = "";
    renderMotd(els.motd, { raw: [], clean: [] });
    els.motd.textContent = "This server is offline or could not be reached. Check the address and edition, then try again.";
  }

  showPanel("status");
  setBusy(false);
}

export function renderRecent(items, onSelect) {
  els.recentList.replaceChildren();
  els.recent.hidden = items.length === 0;

  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = item.address;
    chip.title = `${item.address} (${item.edition})`;
    chip.addEventListener("click", () => onSelect(item));
    fragment.appendChild(chip);
  });

  els.recentList.appendChild(fragment);
}
