import Config from "../config";
import { ElementWithUtils, qsr } from "../utils/dom";

export function set(
  wordEl: ElementWithUtils,
  state: "broken" | "normal",
): void {
  if (state === "normal") {
    wordEl.removeClass("broken-ligatures");
    wordEl.setStyle({ width: "" });
    return;
  }

  const wordsEl = qsr("#words");
  if (Config.typedEffect === "dots" && wordsEl.hasClass("withLigatures")) {
    const width = wordEl.native.getBoundingClientRect().width;
    wordEl.setStyle({ width: `${width}px` });
    wordEl.addClass("broken-ligatures");
  }
}
