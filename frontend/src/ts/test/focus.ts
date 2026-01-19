import * as Caret from "./caret";
import * as LiveSpeed from "./live-speed";
import * as LiveBurst from "./live-burst";
import * as LiveAcc from "./live-acc";
import * as TimerProgress from "./timer-progress";
import * as PageTransition from "../states/page-transition";
import { requestDebouncedAnimationFrame } from "../utils/debounced-animation-frame";
import { getFocus, setFocus } from "../signals/core";
import { qsa, ElementsWithUtils } from "../utils/dom";

const unfocusPx = 3;

let cacheReady = false;
let cache: {
  focus?: ElementsWithUtils;
  cursor?: ElementsWithUtils;
} = {};

function initializeCache(): void {
  if (cacheReady) return;

  const cursorSelector = "body, button, a";
  const elementsSelector = [
    "app",
    "header",
    "footer",
    "main",
    "#bannerCenter",
    "#notificationCenter",
    "#capsWarning",
    "#ad-vertical-right-wrapper",
    "#ad-vertical-left-wrapper",
    "#ad-footer-wrapper",
    "#ad-footer-small-wrapper",
  ].join(",");

  cache.cursor = qsa(cursorSelector);
  cache.focus = qsa(elementsSelector);

  cacheReady = true;
}

// with cursor is a special case that is only used on the initial page load
// to avoid the cursor being invisible and confusing the user
export function set(value: boolean, withCursor = false): void {
  requestDebouncedAnimationFrame("focus.set", () => {
    initializeCache();

    if (value && !getFocus()) {
      setFocus(true);

      // batch DOM operations for better performance
      if (cache.focus) {
        cache.focus.addClass("focus");
      }
      if (!withCursor && cache.cursor) {
        cache.cursor.setStyle({ cursor: "none" });
      }

      Caret.stopAnimation();
      LiveSpeed.show();
      LiveBurst.show();
      LiveAcc.show();
      TimerProgress.show();
    } else if (!value && getFocus()) {
      setFocus(false);

      if (cache.focus) {
        cache.focus.removeClass("focus");
      }
      if (cache.cursor) {
        cache.cursor.setStyle({ cursor: "" });
      }

      Caret.startAnimation();
      LiveSpeed.hide();
      LiveBurst.hide();
      LiveAcc.hide();
      TimerProgress.hide();
    }
  });
}

document.addEventListener("mousemove", function (event) {
  if (PageTransition.get()) return;
  if (!getFocus()) return;
  if (
    // To avoid mouse/desk vibration from creating a flashy effect, we'll unfocus @ >5px instead of >0px
    event.movementX > unfocusPx ||
    event.movementY > unfocusPx
  ) {
    set(false);
  }
});
