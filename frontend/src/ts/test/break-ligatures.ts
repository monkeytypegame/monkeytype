import Config from "../config";
import { ElementWithUtils } from "../utils/dom";

function canBreak(wordEl: ElementWithUtils): boolean {
  if (Config.typedEffect !== "dots") return false;
  if (wordEl.hasClass("broken-ligatures")) return false;

  const parent = wordEl.native.parentElement;
  return !!parent?.classList.contains("withLigatures");
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
  if (key !== "typedEffect") return;
  if (!wordsEl.hasClass("withLigatures")) return;

  wordsEl.qsa(".word.typed").forEach(applyIfNeeded);
}
