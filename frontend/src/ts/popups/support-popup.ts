function show(): void {
  $("#supportMeWrapper")
    .css("opacity", 0)
    .removeClass("hidden")
    .animate({ opacity: 1 }, 125);
}

$("#supportMeButton").on("click", () => {
  show();
});

$(".pageAbout").on("click", "#supportMeAboutButton", () => {
  show();
});

$("#popups").on("click", "#supportMeWrapper", () => {
  $("#supportMeWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#supportMeWrapper").addClass("hidden");
    });
});

$("#popups").on("click", "#supportMeWrapper .button.ads", () => {
  $("#supportMeWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#supportMeWrapper").addClass("hidden");
    });
});

$("#popups").on("click", "#supportMeWrapper a.button", () => {
  $("#supportMeWrapper")
    .css("opacity", 1)
    .animate({ opacity: 0 }, 125, () => {
      $("#supportMeWrapper").addClass("hidden");
    });
});

$(document).on("keypress", "#supportMeButton, #supportMeAboutButton", (e) => {
  if (e.key === "Enter") {
    $(e.currentTarget).trigger("click");
  }
});

$(document).on("keydown", (e) => {
  if (e.key === "Escape" && !$("#supportMeWrapper").hasClass("hidden")) {
    $("#supportMeWrapper")
      .css("opacity", 1)
      .animate({ opacity: 0 }, 125, () => {
        $("#supportMeWrapper").addClass("hidden");
      });
  }
});
