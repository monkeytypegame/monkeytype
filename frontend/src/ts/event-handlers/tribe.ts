import { qs } from "../utils/dom";
import * as Commandline from "../commandline/commandline";
import * as TribeState from "../tribe/tribe-state";

qs(".pageTribe .tribePage.lobby .currentConfig")?.onChild(
  "click",
  "button",
  (e) => {
    const command = (e.target as HTMLElement).getAttribute("data-commands-key");
    if (command === null) return;
    if (!TribeState.isLeader()) return;
    Commandline.show({ subgroupOverride: command });
  },
);
