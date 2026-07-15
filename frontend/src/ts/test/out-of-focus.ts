import * as Misc from "../utils/misc";
import { Config } from "../config/store";
import { qs, qsa } from "../utils/dom";
import { setOutOfFocus } from "../states/test";

const outOfFocusTimeouts: (number | NodeJS.Timeout)[] = [];

const messages = {
  default: "Click here or press any key to focus",
  window: "Click anywhere to focus the window",
};

export function hide(): void {
  qsa("#words")?.setStyle({ transition: "none" })?.removeClass("blurred");
  setOutOfFocus(false);
  qs(".outOfFocusWarning")?.hide();
  Misc.clearTimeouts(outOfFocusTimeouts);
}

export function show(mode: "default" | "window" = "default"): void {
  if (!Config.showOutOfFocusWarning) return;
  outOfFocusTimeouts.push(
    setTimeout(() => {
      qsa("#words")?.setStyle({ transition: "0.25s" })?.addClass("blurred");
      setOutOfFocus(true);
      qs(".outOfFocusWarning .text")?.setText(messages[mode]);
      qs(".outOfFocusWarning")?.show();
    }, 1000),
  );
}
