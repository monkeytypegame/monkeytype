import Config from "../config";
import { qsr } from "../utils/dom";
import { isMac, isLinux, isWindows } from "../utils/misc";

const el = qsr("#capsWarning");

export let capsState = false;
const isMacOs = isMac();
const isLinuxOs = isLinux();
const isWindowsOs = isWindows();

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
  if (isMacOs) {
    // macOs sends only keydown when enabling CapsLock and only keyup when disabling.
    if (event.key === "CapsLock") {
      capsState = isCapsLockOn(event);
    }
  } else if (isWindowsOs) {
    // Windows always sends the correct state on keyup (for CapsLock and regular keys
    capsState = isCapsLockOn(event);
  } else if (event.key !== "CapsLock") {
    capsState = isCapsLockOn(event);
  }
  updateCapsWarningVisibility();
});

document.addEventListener("keydown", (event) => {
  if (isMacOs) {
    // macOs sends only keydown when enabling CapsLock and only keyup when disabling.
    capsState = isCapsLockOn(event);
    updateCapsWarningVisibility();
  } else if (isLinuxOs) {
    /* Linux sends the correct state before the toggle only on keydown,
     * so we invert the modifier state
     */
    if (event.key === "CapsLock") {
      capsState = !isCapsLockOn(event);
    }
  }
});
