const COLORS = Object.freeze({
  "0": "#000000",
  "1": "#0000aa",
  "2": "#00aa00",
  "3": "#00aaaa",
  "4": "#aa0000",
  "5": "#aa00aa",
  "6": "#ffaa00",
  "7": "#aaaaaa",
  "8": "#555555",
  "9": "#5555ff",
  "a": "#55ff55",
  "b": "#55ffff",
  "c": "#ff5555",
  "d": "#ff55ff",
  "e": "#ffff55",
  "f": "#ffffff"
});

const MOTD_BRIGHTEN = Object.freeze({
  "#000000": "#3a3a4a",
  "#0000aa": "#4a4acf",
  "#555555": "#7a7a8a"
});

function freshStyle() {
  return { color: null, bold: false, italic: false, underline: false, strike: false, obfuscated: false };
}

function applyStyle(node, style) {
  if (style.color) node.style.color = MOTD_BRIGHTEN[style.color] || style.color;
  if (style.bold) node.style.fontWeight = "700";
  if (style.italic) node.style.fontStyle = "italic";

  const decorations = [];
  if (style.underline) decorations.push("underline");
  if (style.strike) decorations.push("line-through");
  if (decorations.length) node.style.textDecoration = decorations.join(" ");

  if (style.obfuscated) node.classList.add("mc-obfuscated");
}

function renderLine(text) {
  const line = document.createElement("span");
  line.className = "motd-line";

  let style = freshStyle();
  let buffer = "";

  const flush = () => {
    if (!buffer) return;
    const span = document.createElement("span");
    span.textContent = buffer;
    applyStyle(span, style);
    line.appendChild(span);
    buffer = "";
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if ((char === "\u00a7" || char === "&") && i + 1 < text.length) {
      const code = text[i + 1].toLowerCase();
      const isColor = code in COLORS;
      const isFormat = "klmnor".includes(code);

      if (char === "\u00a7" || isColor || isFormat) {
        if (isColor || isFormat) {
          flush();
          if (isColor) style = { ...freshStyle(), color: COLORS[code] };
          else if (code === "r") style = freshStyle();
          else if (code === "l") style = { ...style, bold: true };
          else if (code === "o") style = { ...style, italic: true };
          else if (code === "n") style = { ...style, underline: true };
          else if (code === "m") style = { ...style, strike: true };
          else if (code === "k") style = { ...style, obfuscated: true };
          i += 1;
          continue;
        }
        if (char === "\u00a7") {
          i += 1;
          continue;
        }
      }
    }

    buffer += char;
  }

  flush();
  return line;
}

export function renderMotd(container, motd) {
  container.replaceChildren();

  const source = motd.raw.length ? motd.raw : motd.clean;
  const hasContent = source.some((line) => line.replace(/\u00a7./g, "").trim().length > 0);

  if (!hasContent) {
    const empty = document.createElement("span");
    empty.className = "empty";
    empty.textContent = "No message of the day provided.";
    container.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  source.forEach((line) => fragment.appendChild(renderLine(line)));
  container.appendChild(fragment);
}
