import Config from "../config";

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
  try {
    if (
      Config.capsLockWarning &&
      event.originalEvent?.getModifierState("CapsLock")
    ) {
      show();
    } else {
      hide();
    }
  } catch {}
});

$(document).keyup(function (event) {
  try {
    if (
      Config.capsLockWarning &&
      event.originalEvent?.getModifierState("CapsLock")
    ) {
      show();
    } else {
      hide();
    }
  } catch {}
});
