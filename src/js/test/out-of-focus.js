import * as Misc from "../misc";

let outOfFocusTimeouts = [];

export function hide() {
  $("#words").css("transition", "none").removeClass("blurred");
  $(".outOfFocusWarning").addClass("hidden");
  Misc.clearTimeouts(outOfFocusTimeouts);
}

export function show() {
  outOfFocusTimeouts.push(
    setTimeout(() => {
      $("#words").css("transition", "0.25s").addClass("blurred");
      $(".outOfFocusWarning").removeClass("hidden");
    }, 1000)
  );
}
