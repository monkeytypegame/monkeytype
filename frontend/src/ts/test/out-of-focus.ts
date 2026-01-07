import * as Misc from "../utils/misc";
import Config from "../config";
import { qs } from "../utils/dom";

const outOfFocusTimeouts: (number | NodeJS.Timeout)[] = [];

export function hide(): void {
  qs("#words, #compositionDisplay")
    ?.setStyle({ transition: "none" })
    ?.removeClass("blurred");
  qs(".outOfFocusWarning")?.hide();
  Misc.clearTimeouts(outOfFocusTimeouts);
}

export function show(): void {
  if (!Config.showOutOfFocusWarning) return;
  outOfFocusTimeouts.push(
    setTimeout(() => {
      qs("#words, #compositionDisplay")
        ?.setStyle({ transition: "0.25s" })
        ?.addClass("blurred");
      qs(".outOfFocusWarning")?.show();
    }, 1000),
  );
}
