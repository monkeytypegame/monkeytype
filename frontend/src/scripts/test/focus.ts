import * as Caret from "./caret";
import * as ActivePage from "../states/active-page";

let state = false;

export function set(foc: boolean, withCursor = false): void {
  if (foc && !state) {
    state = true;
    Caret.stopAnimation();
    $("#top").addClass("focus");
    $("#bottom").addClass("focus");
    if (!withCursor) $("body").css("cursor", "none");
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
  if (!state) return;
  if (ActivePage.get() == "loading") return;
  if (ActivePage.get() == "account" && state == true) return;
  if (
    $("#top").hasClass("focus") &&
    event.originalEvent &&
    (event.originalEvent.movementX > 0 || event.originalEvent.movementY > 0)
  ) {
    set(false);
  }
});
