import { hotkeys } from "../../states/hotkeys";
import { showModal } from "../../states/modals";
import { isAnyPopupVisible, isFirefox } from "../../utils/misc";
import { createHotkey } from "./utils";

export const nonFirefoxCommandlineHotkey = "Mod+Shift+P";

function openCommandline(): void {
  if (isAnyPopupVisible()) return;
  showModal("Commandline");
}

createHotkey(() => hotkeys.commandline, openCommandline);

if (!isFirefox()) {
  createHotkey(nonFirefoxCommandlineHotkey, openCommandline);
}
