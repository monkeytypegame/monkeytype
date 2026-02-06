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
  if (event.key !== "CapsLock") {
    capsState = event.getModifierState("CapsLock");
  }
  updateCapsWarningVisibility();
}

document.addEventListener("keyup", (event) => {
  if (isMacOs) {
    if (event.key === "CapsLock") {
      capsState = event.getModifierState("CapsLock");
    }
  } else if (isWindowsOs) {
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
    if (event.key === "CapsLock") {
      capsState = event.getModifierState("CapsLock");
    } else {
      update(event);
    }
  } else if (isLinuxOs) {
    if (event.key === "CapsLock") {
      capsState = !event.getModifierState("CapsLock");
    }
  }
  updateCapsWarningVisibility();
});
