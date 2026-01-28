import Config from "../config";
import { ElementWithUtils } from "../utils/dom";

export function set(
  wordEl: ElementWithUtils,
  state: "broken" | "normal",
): void {
  if (state === "normal") {
    wordEl.removeClass("broken-ligatures");
    wordEl.setStyle({ width: "" });
    return;
  }

  if (Config.typedEffect !== "dots") return;
  if (wordEl.hasClass("broken-ligatures")) return;

  const parent = wordEl.native.parentElement;
  if (parent?.classList.contains("withLigatures")) {
    const width = wordEl.native.getBoundingClientRect().width;
    wordEl.setStyle({ width: `${width}px` });
    wordEl.addClass("broken-ligatures");
  }
}
