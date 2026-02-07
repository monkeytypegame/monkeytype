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

function updateCapsKeyupFactory(os: string): (event: KeyboardEvent) => void {
  if (os === "Mac") {
    // macOs sends only keydown when enabling CapsLock and only keyup when disabling.
    return (event: KeyboardEvent) => {
      if (event.key === "CapsLock") {
        capsState = isCapsLockOn(event);
      }
    };
  }
  if (os === "Windows") {
    // Windows always sends the correct state on keyup (for CapsLock and for regular keys)
    return (event: KeyboardEvent) => (capsState = isCapsLockOn(event));
  }

  if (os === "Linux") {
    return (event: KeyboardEvent) => {
      if (event.key !== "CapsLock") {
        capsState = isCapsLockOn(event);
      }
    };
  }

  return (event: KeyboardEvent) => {
    return;
  };
}

function updateCapsKeydownFactory(os: string): (event: KeyboardEvent) => void {
  if (os === "Mac") {
    // macOs sends only keydown when enabling CapsLock and only keyup when disabling.
    return (event: KeyboardEvent) => {
      capsState = isCapsLockOn(event);
      updateCapsWarningVisibility();
    };
  }

  if (os === "Linux") {
    /* Linux sends the correct state before the toggle only on keydown,
     * so we invert the modifier state
     */

    return (event: KeyboardEvent) => {
      if (event.key === "CapsLock") {
        capsState = !isCapsLockOn(event);
      }
    };
  }

  return (event: KeyboardEvent) => {
    return;
  };
}

const updateCapsKeyup = updateCapsKeyupFactory(os);
const updateCapsKeydown = updateCapsKeydownFactory(os);

document.addEventListener("keyup", (event) => {
  updateCapsKeyup(event);
  updateCapsWarningVisibility();
});

document.addEventListener("keydown", (event) => {
  updateCapsKeydown(event);
});
