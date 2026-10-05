import { qs } from "../utils/dom";
import { showCommandline } from "../states/commandline";
import * as TribeState from "../tribe/tribe-state";
import { ConfigKey } from "@monkeytype/schemas/configs";

qs(".pageTribe .tribePage.lobby .currentConfig")?.onChild(
  "click",
  "button",
  (e) => {
    const command = (e.target as HTMLElement).getAttribute("data-commands-key");
    if (command === null) return;
    if (!TribeState.isLeader()) return;
    showCommandline({ subgroupOverride: command as ConfigKey });
  },
);
