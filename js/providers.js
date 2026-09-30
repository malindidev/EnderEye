const MCSRVSTAT_JAVA = "https://api.mcsrvstat.us/3/";
const MCSRVSTAT_BEDROCK = "https://api.mcsrvstat.us/bedrock/3/";
const MCSTATUS_JAVA = "https://api.mcstatus.io/v2/status/java/";
const MCSTATUS_BEDROCK = "https://api.mcstatus.io/v2/status/bedrock/";
const PROXY = "https://api.allorigins.win/raw?url=";

function toLines(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split("\n");
  return [];
}

function playerName(entry) {
  if (typeof entry === "string") return entry;
  if (!entry) return "";
  return entry.name_clean || entry.name || entry.name_raw || "";
}

function assertObject(data) {
  if (!data || typeof data !== "object" || typeof data.online !== "boolean") {
    throw new Error("Unexpected response");
  }
}

function parseMcsrvstat(data) {
  assertObject(data);
  const players = data.players || {};
  const motd = data.motd || {};
  const protocol = data.protocol || {};

  return {
    online: data.online,
    host: data.hostname || data.ip || "",
    port: Number(data.port) || 0,
    icon: data.icon || null,
    version: data.version || protocol.name || "",
    software: data.software || "",
    protocol: protocol.version ? String(protocol.version) : "",
    players: {
      online: Number(players.online) || 0,
      max: Number(players.max) || 0,
      list: Array.isArray(players.list) ? players.list.map(playerName).filter(Boolean) : []
    },
    motdRaw: toLines(motd.raw),
    motdClean: toLines(motd.clean)
  };
}

function parseMcstatus(data) {
  assertObject(data);
  const players = data.players || {};
  const motd = data.motd || {};
  const version = data.version || {};

  return {
    online: data.online,
    host: data.host || "",
    port: Number(data.port) || 0,
    icon: data.icon || null,
    version: version.name_clean || version.name || "",
    software: data.software || "",
    protocol: version.protocol ? String(version.protocol) : "",
    players: {
      online: Number(players.online) || 0,
      max: Number(players.max) || 0,
      list: Array.isArray(players.list) ? players.list.map(playerName).filter(Boolean) : []
    },
    motdRaw: toLines(motd.raw),
    motdClean: toLines(motd.clean)
  };
}

export const PROVIDERS = Object.freeze([
  {
    id: "mcsrvstat.us",
    url: (address, edition) => (edition === "bedrock" ? MCSRVSTAT_BEDROCK : MCSRVSTAT_JAVA) + encodeURIComponent(address),
    parse: parseMcsrvstat
  },
  {
    id: "mcstatus.io",
    url: (address, edition) => (edition === "bedrock" ? MCSTATUS_BEDROCK : MCSTATUS_JAVA) + encodeURIComponent(address),
    parse: parseMcstatus
  },
  {
    id: "mcsrvstat.us via proxy",
    url: (address, edition) => PROXY + encodeURIComponent((edition === "bedrock" ? MCSRVSTAT_BEDROCK : MCSRVSTAT_JAVA) + encodeURIComponent(address)),
    parse: parseMcsrvstat
  },
  {
    id: "mcstatus.io via proxy",
    url: (address, edition) => PROXY + encodeURIComponent((edition === "bedrock" ? MCSTATUS_BEDROCK : MCSTATUS_JAVA) + encodeURIComponent(address)),
    parse: parseMcstatus
  }
]);
