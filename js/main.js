import { fetchStatus } from "./api.js";
import { normalizeAddress } from "./validation.js";
import { copyText } from "./clipboard.js";
import { loadRecent, saveRecent, clearRecent } from "./storage.js";
import { AppError } from "./errors.js";
import { initBackground } from "./background.js";
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

function syncUrl(address, edition) {
  const url = new URL(window.location.href);
  url.searchParams.set("server", address);
  url.searchParams.set("edition", edition);
  window.history.replaceState(null, "", url);
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

function init() {
  initBackground(document.getElementById("particles"));

  els.form.addEventListener("submit", handleSubmit);
  els.input.addEventListener("input", ui.clearInvalidInput);
  els.copy.addEventListener("click", handleCopy);
  els.refresh.addEventListener("click", handleRefresh);
  els.errorRetry.addEventListener("click", handleRetry);
  els.recentClear.addEventListener("click", handleClearRecent);

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
