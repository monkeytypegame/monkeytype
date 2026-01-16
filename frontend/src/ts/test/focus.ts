import * as Caret from "./caret";
import * as LiveSpeed from "./live-speed";
import * as LiveBurst from "./live-burst";
import * as LiveAcc from "./live-acc";
import * as TimerProgress from "./timer-progress";
import * as PageTransition from "../states/page-transition";
import { requestDebouncedAnimationFrame } from "../utils/debounced-animation-frame";
import { getFocus, setFocus } from "../signals/core";

const unfocusPx = 3;

let cacheReady = false;
let cache: {
  focus?: HTMLElement[];
  cursor?: HTMLElement[];
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

  cache.cursor = [...document.querySelectorAll<HTMLElement>(cursorSelector)];
  cache.focus = [...document.querySelectorAll<HTMLElement>(elementsSelector)];

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
        for (const el of cache.focus) {
          el.classList.add("focus");
        }
      }
      if (!withCursor && cache.cursor) {
        for (const el of cache.cursor) {
          el.style.cursor = "none";
        }
      }

      Caret.stopAnimation();
      LiveSpeed.show();
      LiveBurst.show();
      LiveAcc.show();
      TimerProgress.show();
    } else if (!value && getFocus()) {
      setFocus(false);

      if (cache.focus) {
        for (const el of cache.focus) {
          el.classList.remove("focus");
        }
      }
      if (cache.cursor) {
        for (const el of cache.cursor) {
          el.style.cursor = "";
        }
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
