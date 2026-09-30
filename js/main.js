import { fetchStatus } from "./api.js";
import { normalizeAddress } from "./validation.js";
import { copyText } from "./clipboard.js";
import { loadRecent, saveRecent, clearRecent } from "./storage.js";
import { AppError } from "./errors.js";
import { initTheme } from "./theme.js";
import * as ui from "./ui.js";

const { els } = ui;

const state = {
  controller: null,
  current: null,
  copyValue: ""
};

function getEdition() {
  const checked = els.form.querySelector('input[name="edition"]:checked');
  return checked ? checked.value : "java";
}

function setEdition(value) {
  const target = els.form.querySelector(`input[name="edition"][value="${value}"]`);
  if (target) target.checked = true;
}

function buildShareUrl(address, edition) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("server", address);
  url.searchParams.set("edition", edition);
  return url.toString();
}

function syncUrl(address, edition) {
  window.history.replaceState(null, "", buildShareUrl(address, edition));
}

async function runCheck(rawAddress, edition) {
  let address;

  try {
    address = normalizeAddress(rawAddress);
  } catch (error) {
    ui.flagInvalidInput();
    ui.showError(error.title, error.message);
    return;
  }

  state.controller?.abort("cancelled");
  const controller = new AbortController();
  state.controller = controller;
  state.current = { address, edition };

  els.input.value = address;
  ui.clearInvalidInput();
  ui.showLoading();

  try {
    const result = await fetchStatus(address, edition, controller.signal);
    if (state.controller !== controller) return;

    state.copyValue = result.address;
    ui.renderStatus(result);
    syncUrl(address, edition);
    ui.renderRecent(saveRecent(address, edition), handleRecentSelect);
  } catch (error) {
    if (state.controller !== controller) return;
    if (error.name === "AbortError") return;

    if (error instanceof AppError) {
      ui.showError(error.title, error.message);
    } else {
      ui.showError("Unexpected error", "Something went wrong while checking that server.");
    }
  }
}

function handleSubmit(event) {
  event.preventDefault();
  runCheck(els.input.value, getEdition());
}

function handleRecentSelect(item) {
  setEdition(item.edition);
  runCheck(item.address, item.edition);
}

async function handleCopy() {
  if (!state.copyValue) return;
  const success = await copyText(state.copyValue);
  ui.flashCopied(success);
}

async function handleShare() {
  if (!state.current) return;
  const success = await copyText(buildShareUrl(state.current.address, state.current.edition));
  ui.showToast(success ? "Shareable link copied" : "Could not copy the link");
}

function handleRefresh() {
  if (state.current) runCheck(state.current.address, state.current.edition);
}

function handleRetry() {
  runCheck(els.input.value, getEdition());
}

function handleClearRecent() {
  clearRecent();
  ui.renderRecent([], handleRecentSelect);
}

function handleShortcut(event) {
  if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
  const tag = document.activeElement ? document.activeElement.tagName : "";
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  event.preventDefault();
  els.input.focus();
  els.input.select();
}

function init() {
  initTheme(els.themeToggle);

  els.form.addEventListener("submit", handleSubmit);
  els.input.addEventListener("input", ui.clearInvalidInput);
  els.copy.addEventListener("click", handleCopy);
  els.share.addEventListener("click", handleShare);
  els.refresh.addEventListener("click", handleRefresh);
  els.errorRetry.addEventListener("click", handleRetry);
  els.recentClear.addEventListener("click", handleClearRecent);
  document.addEventListener("keydown", handleShortcut);

  ui.renderRecent(loadRecent(), handleRecentSelect);

  const params = new URLSearchParams(window.location.search);
  const server = params.get("server");
  const edition = params.get("edition") === "bedrock" ? "bedrock" : "java";

  if (server) {
    setEdition(edition);
    els.input.value = server;
    runCheck(server, edition);
  } else {
    els.input.focus();
  }
}

init();
