import { init as initComposition } from "./composition";
import { init as initKey } from "./key";
import { init as initInput } from "./input";
import { init as initMisc } from "./misc";

export function initInputListeners(): void {
  initComposition();
  initKey();
  initInput();
  initMisc();
}
