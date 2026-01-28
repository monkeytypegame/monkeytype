import Config from "../config";
import { ElementWithUtils } from "../utils/dom";

function canBreak(wordEl: ElementWithUtils): boolean {
  if (Config.typedEffect !== "dots") return false;
  if (wordEl.hasClass("broken-ligatures")) return false;

  return !!wordEl.native.closest(".withLigatures");
}

function applyIfNeeded(wordEl: ElementWithUtils): void {
  if (!canBreak(wordEl)) return;

  const { width } = wordEl.native.getBoundingClientRect();
  wordEl.setStyle({ width: `${width}px` });
  wordEl.addClass("broken-ligatures");
}

function reset(wordEl: ElementWithUtils): void {
  if (!wordEl.hasClass("broken-ligatures")) return;
  wordEl.removeClass("broken-ligatures");
  wordEl.setStyle({ width: "" });
}

export function set(
  wordEl: ElementWithUtils,
  state: "broken" | "normal",
): void {
  state === "normal" ? reset(wordEl) : applyIfNeeded(wordEl);
}

export function update(key: string, wordsEl: ElementWithUtils): void {
  if (!["typedEffect", "fontFamily", "fontSize"].includes(key)) return;

  const words = wordsEl.qsa(".word.typed");

  const shouldReset =
    !wordsEl.hasClass("withLigatures") ||
    Config.typedEffect !== "dots" ||
    key === "fontFamily" ||
    key === "fontSize";

  if (shouldReset) {
    words.forEach(reset);
  }
  words.forEach(applyIfNeeded);
}
