import * as Caret from "./caret";
import * as ActivePage from "../states/active-page";

const unfocusPx = 3;
let state = false;

export function set(foc: boolean, withCursor = false): void {
  if (foc && !state) {
    state = true;
    Caret.stopAnimation();
    $("#top").addClass("focus");
    $("#bottom").addClass("focus");
    if (!withCursor) $("body").css("cursor", "none");
    $("#middle").addClass("focus");
    $("#bannerCenter").addClass("focus");
    $("#capsWarning").addClass("focus");
  } else if (!foc && state) {
    state = false;
    Caret.startAnimation();
    $("#top").removeClass("focus");
    $("#bottom").removeClass("focus");
    $("body").css("cursor", "default");
    $("#middle").removeClass("focus");
    $("#bannerCenter").removeClass("focus");
    $("#capsWarning").removeClass("focus");
    $("#app").removeClass("focus");
  }
}

$(document).mousemove(function (event) {
  if (!state) return;
  if (ActivePage.get() == "loading") return;
  if (ActivePage.get() == "account" && state == true) return;
  if (
    $("#top").hasClass("focus") &&
    event.originalEvent &&
    // To avoid mouse/desk vibration from creating a flashy effect, we'll unfocus @ >5px instead of >0px
    (event.originalEvent.movementX > unfocusPx ||
      event.originalEvent.movementY > unfocusPx)
  ) {
    set(false);
  }
});
