import { Config } from "../config/store";
import { ElementWithUtils } from "../utils/dom";

function canBreak(wordEl: ElementWithUtils): boolean {
  if (Config.typedEffect !== "dots") return false;
  if (wordEl.hasClass("broken-joining")) return false;

  return wordEl.getParent()?.hasClass("joiningScript") ?? false;
}

function applyIfNeeded(wordEl: ElementWithUtils): void {
  if (!canBreak(wordEl)) return;

  const letters = wordEl.qsa("letter");
  const firstTop = Math.floor(letters[0]?.getOffsetTop() ?? 0);
  const isWrapped = letters.some(
    (l) => Math.floor(l.getOffsetTop()) !== firstTop,
  );

  if (!isWrapped) {
    const { width } = wordEl.screenBounds();
    wordEl.setStyle({ width: `${width}px` });
    wordEl.removeClass("needs-wrap");
  } else {
    wordEl.setStyle({ width: "" });
    wordEl.addClass("needs-wrap");
  }
  wordEl.addClass("broken-joining");
}

function reset(wordEl: ElementWithUtils): void {
  if (!wordEl.hasClass("broken-joining")) return;
  wordEl.removeClass("broken-joining");
  wordEl.removeClass("needs-wrap");
  wordEl.setStyle({ width: "" });
}

export function set(wordEl: ElementWithUtils, joiningBroken: boolean): void {
  joiningBroken ? applyIfNeeded(wordEl) : reset(wordEl);
}

export function update(key: string, wordsEl: ElementWithUtils): void {
  const words = wordsEl.qsa(".word.typed");

  const shouldReset =
    !wordsEl.hasClass("joiningScript") ||
    Config.typedEffect !== "dots" ||
    key === "fontFamily" ||
    key === "fontSize";

  if (shouldReset) {
    words.forEach(reset);
  }
  words.forEach(applyIfNeeded);
}
