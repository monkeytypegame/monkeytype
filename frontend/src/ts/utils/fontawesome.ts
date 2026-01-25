import { initIcons } from "virtual:fa-icons";
import { dom, config } from "@fortawesome/fontawesome-svg-core";

export function initFontawesome(): void {
  initIcons();
  config.autoReplaceSvg = "nest";
  config.observeMutations = true;

  dom.watch();
}
