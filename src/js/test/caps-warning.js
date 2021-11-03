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

$(document).keydown(function (event) {
  try {
    if (event.originalEvent.getModifierState("CapsLock")) {
      show();
    } else {
      hide();
    }
  } catch {}
});
