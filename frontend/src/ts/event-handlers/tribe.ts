import { qs } from "../utils/dom";
import * as Commandline from "../commandline/commandline";
import * as TribeState from "../tribe/tribe-state";

qs(".pageTribe .tribePage.lobby .currentConfig")?.onChild(
  "click",
  ".group",
  (e) => {
    const command = (e.target as HTMLElement).getAttribute("commands");
    if (command === null) return;
    if (!TribeState.isLeader()) return;
    Commandline.show({ subgroupOverride: command });
  },
);
