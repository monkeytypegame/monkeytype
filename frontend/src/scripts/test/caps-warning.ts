import Config from "../config";

export let capsState = false;

function show(): void {
  if ($("#capsWarning").hasClass("hidden")) {
    $("#capsWarning").removeClass("hidden");
  }
}

function hide(): void {
  if (!$("#capsWarning").hasClass("hidden")) {
    $("#capsWarning").addClass("hidden");
  }
}

$(document).keydown(function (event) {
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

$(document).keyup(function (event) {
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
