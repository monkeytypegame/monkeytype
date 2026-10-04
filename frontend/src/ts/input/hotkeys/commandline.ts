import { showCommandline } from "../../states/commandline";
import { hotkeys } from "../../states/hotkeys";
import { isAnyPopupVisible } from "../../utils/misc";
import { createHotkey } from "./utils";

function openCommandline(): void {
  if (isAnyPopupVisible()) return;
  showCommandline();
}

createHotkey(() => hotkeys.commandline, openCommandline);
createHotkey("Mod+Shift+P", openCommandline);
