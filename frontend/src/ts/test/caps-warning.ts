import Config from "../config";
import * as Misc from "../utils/misc";
import { ModifierKeys } from "../constants/modifier-keys";

const el = document.querySelector("#capsWarning") as HTMLElement;

export let capsState = false;

let visible = false;

function show(): void {
  if (!visible) {
    el?.classList.remove("hidden");
    visible = true;
  }
}

function hide(): void {
  if (visible) {
    el?.classList.add("hidden");
    visible = false;
  }
}

function update(event: JQuery.KeyDownEvent | JQuery.KeyUpEvent): void {
  const key = event?.originalEvent?.key;

  // Ignore modifier keys (except CapsLock itself) to prevent false toggles
  if (key !== undefined && key !== "CapsLock" && ModifierKeys.includes(key)) {
    return;
  }

  if (key === "CapsLock" && capsState !== null) {
    capsState = !capsState;
  } else {
    const modState = event?.originalEvent?.getModifierState?.("CapsLock");
    if (modState !== undefined) {
      capsState = modState;
    }
  }

  try {
    if (Config.capsLockWarning && capsState) {
      show();
    } else {
      hide();
    }
  } catch {}
}

$(document).on("keyup", update);

$(document).on("keydown", (event) => {
  if (Misc.isMac()) update(event);
});
