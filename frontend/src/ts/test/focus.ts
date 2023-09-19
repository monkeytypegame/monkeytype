import * as Caret from "./caret";
import * as ActivePage from "../states/active-page";
import * as LiveWpm from "./live-wpm";
import * as LiveBurst from "./live-burst";
import * as LiveAcc from "./live-acc";

const unfocusPx = 3;
let state = false;

export function set(foc: boolean, withCursor = false): void {
  if (foc && !state) {
    state = true;
    Caret.stopAnimation();
    $("header").addClass("focus");
    $("footer").addClass("focus");
    if (!withCursor) $("body").css("cursor", "none");
    $("#middle").addClass("focus");
    $("#testConfig").addClass("focus");
    $("#mobileTestConfig").addClass("focus");
    $("#bannerCenter").addClass("focus");
    $("#notificationCenter").addClass("focus");
    $("#capsWarning").addClass("focus");
    $("#ad-vertical-right-wrapper").addClass("focus");
    $("#ad-vertical-left-wrapper").addClass("focus");
    $("#ad-footer-wrapper").addClass("focus");
    $("#ad-footer-small-wrapper").addClass("focus");
    LiveWpm.show();
    LiveBurst.show();
    LiveAcc.show();
  } else if (!foc && state) {
    state = false;
    Caret.startAnimation();
    $("header").removeClass("focus");
    $("footer").removeClass("focus");
    $("body").css("cursor", "default");
    $("#middle").removeClass("focus");
    $("#testConfig").removeClass("focus");
    $("#mobileTestConfig").removeClass("focus");
    $("#bannerCenter").removeClass("focus");
    $("#notificationCenter").removeClass("focus");
    $("#capsWarning").removeClass("focus");
    $("#app").removeClass("focus");
    $("#ad-vertical-right-wrapper").removeClass("focus");
    $("#ad-vertical-left-wrapper").removeClass("focus");
    $("#ad-footer-wrapper").removeClass("focus");
    $("#ad-footer-small-wrapper").removeClass("focus");
    LiveWpm.hide();
    LiveBurst.hide();
    LiveAcc.hide();
  }
}

$(document).on("mousemove", function (event) {
  if (!state) return;
  if (ActivePage.get() === "loading") return;
  if (ActivePage.get() === "account" && state === true) return;
  if (
    event.originalEvent &&
    // To avoid mouse/desk vibration from creating a flashy effect, we'll unfocus @ >5px instead of >0px
    (event.originalEvent.movementX > unfocusPx ||
      event.originalEvent.movementY > unfocusPx)
  ) {
    set(false);
  }
});
