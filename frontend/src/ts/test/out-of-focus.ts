import * as Misc from "../utils/misc";
import Config from "../config";

const outOfFocusTimeouts: (number | NodeJS.Timeout)[] = [];

const blurTargets = "#words, #compositionDisplay";

export function hide(): void {
  document.querySelectorAll(blurTargets).forEach((el) => {
    (el as HTMLElement).style.transition = "none";
    el.classList.remove("blurred");
  });
  document.querySelector(".outOfFocusWarning")?.classList.add("hidden");
  Misc.clearTimeouts(outOfFocusTimeouts);
}

export function show(): void {
  if (!Config.showOutOfFocusWarning) return;
  outOfFocusTimeouts.push(
    setTimeout(() => {
      document.querySelectorAll(blurTargets).forEach((el) => {
        (el as HTMLElement).style.transition = "0.25s";
        el.classList.add("blurred");
      });
      document.querySelector(".outOfFocusWarning")?.classList.remove("hidden");
    }, 1000),
  );
}
