import Config from "../config";
import * as Misc from "../utils/misc";
import { qsr } from "../utils/dom";

const el = qsr("#capsWarning");

export let capsState = false;

let visible = false;

function show(): void {
  if (!visible) {
    el.removeClass("hidden");
    visible = true;
  }
}

function hide(): void {
  if (visible) {
    el.addClass("hidden");
    visible = false;
  }
}

function update(event: Event): void {
  let newCapsState: boolean | undefined = undefined;

  if (event instanceof KeyboardEvent) {
    const modState = event.getModifierState?.("CapsLock");
    if (modState !== undefined) {
      newCapsState = modState;
    } else if (event.key === "CapsLock") {
      // If getModifierState is not available or returns undefined,
      // and the key pressed is CapsLock, toggle the current state.
      // This handles cases where getModifierState might not be reliable
      // or available (e.g., older browsers, or specific OS/browser combinations).
      newCapsState = !capsState; // Use the global capsState for toggling
    }
  } else if (event instanceof MouseEvent) {
    const modState = event.getModifierState?.("CapsLock");
    if (modState !== undefined) {
      newCapsState = modState;
    }
  }

  // Only update the global capsState if newCapsState was determined
  if (newCapsState !== undefined) {
    capsState = newCapsState;
  }

  try {
    if (Config.capsLockWarning && capsState) {
      show();
    } else {
      hide();
    }
  } catch {}
}

document.addEventListener("keyup", update);

document.addEventListener("keydown", (event) => {
  if (Misc.isMac()) update(event);
});

document.addEventListener("mousedown", update);
document.addEventListener("mouseup", update);
