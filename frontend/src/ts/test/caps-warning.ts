import Config from "../config";
import { qsr } from "../utils/dom";
import { onCapsLockChange } from "@leonabcd123/modern-caps-lock";

const el = qsr("#capsWarning");
let visible = false;

export let capsState = false;

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

onCapsLockChange((currentCapsState: boolean) => {
  capsState = currentCapsState;
  updateCapsWarningVisibility();
});
