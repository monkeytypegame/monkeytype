import { Config } from "../config/store";
import { qsr } from "../utils/dom";
import { onCapsLockChange, isCapsLockOn } from "@leonabcd123/modern-caps-lock";

const el = qsr("#capsWarning");

function updateCapsWarningVisibility(): void {
  if (Config.capsLockWarning && isCapsLockOn()) {
    el.show();
  } else {
    el.hide();
  }
}

onCapsLockChange(() => {
  updateCapsWarningVisibility();
});
