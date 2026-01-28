import Config from "../config";
import { ElementWithUtils, qsr } from "../utils/dom";

export function breakLigaturesForWord(wordEl: ElementWithUtils): void {
  const wordsEl = qsr("#words");
  if (Config.typedEffect === "dots" && wordsEl.hasClass("withLigatures")) {
    wordEl.addClass("broken-ligatures");
  }
}
