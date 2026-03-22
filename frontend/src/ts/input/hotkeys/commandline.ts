import { hotkeys } from "../../states/hotkeys";
import { showModal } from "../../states/modals";
import { createHotkey } from "./utils";

function openCommandline(): void {
  showModal("Commandline");
}

createHotkey(() => hotkeys.commandline, openCommandline);
createHotkey("Mod+Shift+P", openCommandline);
