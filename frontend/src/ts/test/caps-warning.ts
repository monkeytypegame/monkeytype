import Config from "../config";
import { qsr } from "../utils/dom";
import { isMac, isLinux, isWindows } from "../utils/misc";

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

function getCurrentOs(): string {
  if (isMac()) {
    return "Mac";
  }
  if (isLinux()) {
    return "Linux";
  }
  if (isWindows()) {
    return "Windows";
  }
  return "Unknown";
}

function updateCapsKeyup(event: KeyboardEvent): void {
  const os = getCurrentOs();
  if (os === "Mac") {
    // macOs sends only keydown when enabling CapsLock and only keyup when disabling.
    if (event.key === "CapsLock") {
      capsState = isCapsLockOn(event);
    }
  } else if (os === "Windows") {
    // Windows always sends the correct state on keyup (for CapsLock and regular keys
    capsState = isCapsLockOn(event);
  } else if (event.key !== "CapsLock") {
    capsState = isCapsLockOn(event);
  }
  updateCapsWarningVisibility();
}

function updateCapsKeydown(event: KeyboardEvent): void {
  const os = getCurrentOs();
  if (os === "Mac") {
    // macOs sends only keydown when enabling CapsLock and only keyup when disabling.
    capsState = isCapsLockOn(event);
    updateCapsWarningVisibility();
  } else if (os === "Linux") {
    /* Linux sends the correct state before the toggle only on keydown,
     * so we invert the modifier state
     */
    if (event.key === "CapsLock") {
      capsState = !isCapsLockOn(event);
    }
  }
}

document.addEventListener("keyup", (event) => {
  updateCapsKeyup(event);
});

document.addEventListener("keydown", (event) => {
  updateCapsKeydown(event);
});
