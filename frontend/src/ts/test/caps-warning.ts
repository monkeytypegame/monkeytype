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

function update(event: KeyboardEvent): void {
  capsState = event?.getModifierState("CapsLock");

  if (event.key === "CapsLock") {
    capsState = !capsState;
  }
}

function updateWarningVisibility(): void {
  try {
    if (Config.capsLockWarning && capsState) {
      show();
    } else {
      hide();
    }
  } catch {}
}

function updateCapsForMac(eventType: "keyup" | "keydown"): void {
  if (eventType === "keyup") {
    capsState = false;
  } else {
    capsState = true;
  }
}

document.addEventListener("keyup", (event) => {
  if (Misc.isMac()) updateCapsForMac("keyup");
  updateWarningVisibility();
});

document.addEventListener("keydown", (event) => {
  if (Misc.isMac()) {
    updateCapsForMac("keyup");
  } else {
    update(event);
  }
});
