import Config from "../config";

export let capsState = false;

let visible = false;

function show(): void {
  if (!visible) {
    $("#capsWarning").removeClass("hidden");
    visible = true;
  }
}

function hide(): void {
  if (visible) {
    $("#capsWarning").addClass("hidden");
    visible = false;
  }
}

$("#wordsInput").on("keydown", function (event) {
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

$("#wordsInput").on("keyup", function (event) {
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
});
