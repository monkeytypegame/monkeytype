import * as Misc from "../misc";

const outOfFocusTimeouts: (number | NodeJS.Timeout)[] = [];

export function hide(): void {
  $("#words").css("transition", "none").removeClass("blurred");
  $(".outOfFocusWarning").addClass("hidden");
  Misc.clearTimeouts(outOfFocusTimeouts);
}

export function show(): void {
  outOfFocusTimeouts.push(
    setTimeout(() => {
      $("#words").css("transition", "0.25s").addClass("blurred");
      $(".outOfFocusWarning").removeClass("hidden");
    }, 1000)
  );
}
