import Config from "../config";

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

$(document).on("keydown", function (event) {
  if (
    event?.originalEvent?.getModifierState &&
    event?.originalEvent?.getModifierState("CapsLock")
  ) {
    capsState = true;
  } else {
    capsState = false;
  }

  try {
    if (Config.capsLockWarning && capsState) {
      show();
    } else {
      hide();
    }
  } catch {}
});

$(document).on("keyup", function (event) {
  setTimeout(() => {
    if (
      event?.originalEvent?.getModifierState &&
      event?.originalEvent?.getModifierState("CapsLock")
    ) {
      //filthy fix but optional chaining refues to work
      capsState = true;
    } else {
      capsState = false;
    }

    try {
      if (Config.capsLockWarning && capsState) {
        show();
      } else {
        hide();
      }
    } catch {}
  }, 1); // weird fix to make sure the caps warning doesnt get stuck on linux
});
