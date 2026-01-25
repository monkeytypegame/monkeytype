import { initIcons } from "virtual:fa-icons";
import { dom, config } from "@fortawesome/fontawesome-svg-core";

export function initFontawesome(): void {
  initIcons();

  //configure fontawesome to keep i tags and add the svg within
  //hopefully this will not break any existing css or js selectors
  config.autoReplaceSvg = "nest";
  config.observeMutations = true;
  config.replacementClass = "fa";

  dom.watch();
}
