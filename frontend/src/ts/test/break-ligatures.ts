import Config from "../config";
import { ElementWithUtils, qsr } from "../utils/dom";

export function set(
  wordEl: ElementWithUtils,
  state: "broken" | "normal",
): void {
  if (state === "normal") {
    wordEl.removeClass("broken-ligatures");
    return;
  }

  const wordsEl = qsr("#words");
  if (Config.typedEffect === "dots" && wordsEl.hasClass("withLigatures")) {
    wordEl.addClass("broken-ligatures");
  }
}
