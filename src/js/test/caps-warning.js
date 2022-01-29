import Config from "./config";

function show() {
  if ($("#capsWarning").hasClass("hidden")) {
    $("#capsWarning").removeClass("hidden");
  }
}

function hide() {
  if (!$("#capsWarning").hasClass("hidden")) {
    $("#capsWarning").addClass("hidden");
  }
}

let capsLockOn = false;

$(document).keyup(function (event) {
  try {
    if (
      (capsLockOn && event.originalEvent.which === 20) ||
      !Config.capsLockWarning
    ) {
      capsLockOn = false;
      hide();
      return;
    }

    capsLockOn = event.originalEvent.getModifierState("CapsLock");

    if (capsLockOn) {
      show();
    } else {
      hide();
    }
  } catch {}
});
