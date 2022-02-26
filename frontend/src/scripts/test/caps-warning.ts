import Config from "../config";

export let capsLock = false;

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
  if (event.originalEvent?.getModifierState("CapsLock")) {
    capsLock = true;
  } else {
    capsLock = false;
  }

  try {
    if (Config.capsLockWarning && capsLock) {
      show();
    } else {
      hide();
    }
  } catch {}
});

$(document).keyup(function (event) {
  if (event.originalEvent?.getModifierState("CapsLock")) {
    capsLock = true;
  } else {
    capsLock = false;
  }

  try {
    if (Config.capsLockWarning && capsLock) {
      show();
    } else {
      hide();
    }
  } catch {}
});
