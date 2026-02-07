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

function updateFromEvent(event: KeyboardEvent): void {
  const modState = event.getModifierState?.("CapsLock");

  if (modState !== undefined) {
    capsState = modState;
  }

  try {
    if (Config.capsLockWarning && capsState) {
      show();
    } else {
      hide();
    }
  } catch {}
}

function update(event: KeyboardEvent): void {
  // Linux: CapsLock modifier state may not be updated synchronously
  // when the CapsLock key event fires, so defer the read.
  if (Misc.isLinux() && event.key === "CapsLock") {
    setTimeout(() => updateFromEvent(event), 0);
  } else {
    updateFromEvent(event);
  }
}

document.addEventListener("keyup", update);

document.addEventListener("keydown", (event) => {
  if (Misc.isMac()) update(event);
});
