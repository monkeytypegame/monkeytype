import Config from "../config";
import { qsr } from "../utils/dom";
import { getCurrentOs } from "../utils/misc";

const el = qsr("#capsWarning");

export let capsState = false;
const os = getCurrentOs();

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

function updateCapsWarningVisibility(): void {
  try {
    if (Config.capsLockWarning && capsState) {
      show();
    } else {
      hide();
    }
  } catch {}
}

function isCapsLockOn(event: KeyboardEvent): boolean {
  return event.getModifierState("CapsLock");
}

document.addEventListener("keyup", (event) => {
  if (os === "Mac") {
    // macOS sends only keydown when enabling Caps Lock and only keyup when disabling.
    if (event.key === "CapsLock") {
      capsState = isCapsLockOn(event);
    }
  } else if (os === "Windows") {
    // Windows always sends the correct state on keyup (for Caps Lock and for regular keys)
    capsState = isCapsLockOn(event);
  } else if (event.key !== "CapsLock") {
    // Linux sends the correct state on keyup if key isn't Caps Lock
    capsState = isCapsLockOn(event);
  }
  updateCapsWarningVisibility();
});

document.addEventListener("keydown", (event) => {
  if (os === "Mac") {
    // macOS sends only keydown when enabling Caps Lock and only keyup when disabling.
    capsState = isCapsLockOn(event);
    updateCapsWarningVisibility();
  } else if (os === "Linux") {
    /* Linux sends the correct state before Caps Lock is toggled only on keydown,
     * so we invert the modifier state
     */
    if (event.key === "CapsLock") {
      capsState = !isCapsLockOn(event);
    }
  }
});
