import * as Caret from "./caret";
import { requestDebouncedAnimationFrame } from "../utils/debounced-animation-frame";
import { getFocus, setFocus } from "../states/test";
import { isInitialLoad } from "../states/router";
import { qsa, ElementsWithUtils } from "../utils/dom";

const unfocusPx = 3;

let cacheReady = false;
let cache: {
  focus?: ElementsWithUtils;
  cursor?: ElementsWithUtils;
} = {};

function initializeCache(): void {
  if (cacheReady) return;

  const elementsSelector = ["app", "footer", "main", "#bannerCenter"].join(",");

  cache.focus = qsa(elementsSelector);

  cacheReady = true;
}

// value of a set() call still waiting for its animation frame
let pendingValue: boolean | undefined;

// with cursor is a special case that is only used on the initial page load
// to avoid the cursor being invisible and confusing the user
export function set(value: boolean, withCursor = false): void {
  // compare against the pending value too, otherwise set(false) right after
  // set(true) is ignored and the pending set(true) still applies
  if (value === (pendingValue ?? getFocus())) return;
  pendingValue = value;
  requestDebouncedAnimationFrame("focus.set", () => {
    pendingValue = undefined;
    initializeCache();
    cache.cursor = qsa("body, button, a");

    if (value && !getFocus()) {
      setFocus(true);

      // batch DOM operations for better performance
      if (cache.focus) {
        cache.focus.addClass("focus");
      }
      if (!withCursor && cache.cursor !== undefined) {
        cache.cursor.setStyle({ cursor: "none" });
      }

      Caret.stopAnimation();
    } else if (!value && getFocus()) {
      setFocus(false);

      if (cache.focus) {
        cache.focus.removeClass("focus");
      }
      if (cache.cursor !== undefined) {
        cache.cursor.setStyle({ cursor: "" });
      }

      Caret.startAnimation();
    }
  });
}

document.addEventListener("mousemove", function (event) {
  if (!getFocus()) return;
  if (isInitialLoad()) return;
  if (
    // To avoid mouse/desk vibration from creating a flashy effect, we'll unfocus @ >5px instead of >0px
    event.movementX > unfocusPx ||
    event.movementY > unfocusPx
  ) {
    set(false);
  }
});
