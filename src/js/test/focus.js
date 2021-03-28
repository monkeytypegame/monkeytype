import * as Caret from "./caret";

let state = false;

export function set(foc) {
  if (foc && !state) {
    state = true;
    Caret.stopAnimation();
    $("#top").addClass("focus");
    $("#bottom").addClass("focus");
    $("body").css("cursor", "none");
    $("#middle").addClass("focus");
  } else if (!foc && state) {
    state = false;
    Caret.startAnimation();
    $("#top").removeClass("focus");
    $("#bottom").removeClass("focus");
    $("body").css("cursor", "default");
    $("#middle").removeClass("focus");
  }
}

$(document).mousemove(function (event) {
  if (
    $("#top").hasClass("focus") &&
    (event.originalEvent.movementX > 0 || event.originalEvent.movementY > 0)
  ) {
    set(false);
  }
});
