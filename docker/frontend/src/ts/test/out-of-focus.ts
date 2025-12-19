import * as Misc from "../utils/misc";
import Config from "../config";

const outOfFocusTimeouts: (number | NodeJS.Timeout)[] = [];

export function hide(): void {
  $("#words, #compositionDisplay")
    .css("transition", "none")
    .removeClass("blurred");
  $(".outOfFocusWarning").addClass("hidden");
  Misc.clearTimeouts(outOfFocusTimeouts);
}

export function show(): void {
  if (!Config.showOutOfFocusWarning) return;
  outOfFocusTimeouts.push(
    setTimeout(() => {
      $("#words, #compositionDisplay")
        .css("transition", "0.25s")
        .addClass("blurred");
      $(".outOfFocusWarning").removeClass("hidden");
    }, 1000),
  );
}
