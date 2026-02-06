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

function update(event: KeyboardEvent): void {
  /*
     CapsLock is pressed. We cannot use the modifierState for "CapsLock" in this case
     because the browser implementation differs widely depending on the browser and even the
     operating system.
   */
  if (event.key !== "CapsLock") {
    /* on all other key presses we can trust the modifierState */
    capsState = event.getModifierState("CapsLock");
  }
}

document.addEventListener("keyup", (event) => {
  if (isMacOs) {
    if (event.key === "CapsLock") {
      capsState = event.getModifierState("CapsLock");
    }
  } else if (isWindowsOs) {
    /**
     * Windows sends the correct state on keyup
     */
    if (event.key === "CapsLock") {
      capsState = event.getModifierState("CapsLock");
    }
  } else {
    update(event);
  }
  updateCapsWarningVisibility();
});

document.addEventListener("keydown", (event) => {
  if (isMacOs) {
    /* macOs sends only keyDown when enabling CapsLock and only keyUp when disabling. */
    if (event.key === "CapsLock") {
      capsState = event.getModifierState("CapsLock");
    } else {
      update(event);
    }
  } else if (isLinuxOs) {
    /**
     * Linux sends the correct state before the toggle only on keydown, so we invert the modifier state
     */
    if (event.key === "CapsLock") {
      capsState = !event.getModifierState("CapsLock");
    }
  }
  updateCapsWarningVisibility();
});
