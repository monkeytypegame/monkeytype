$(document.body).on(
  "click",
  "#contactPopupButton, #contactPopupButton2",
  () => {
    $("#contactPopupWrapper")
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125);
  }
);

$(document.body).on("click", "#contactPopupWrapper", (e) => {
  if ($(e.target).attr("id") === "contactPopupWrapper") {
    $("#contactPopupWrapper")
      .css("opacity", 1)
      .animate({ opacity: 0 }, 125, () => {
        $("#contactPopupWrapper").addClass("hidden");
      });
  }
});

$(document.body).on(
  "keypress",
  "#contactPopupButton, #contactPopupButton2",
  (e) => {
    if (e.key === "Enter") {
      $(e.currentTarget).trigger("click");
    }
  }
);

$(document).on("keydown", (e) => {
  if (e.key === "Escape" && !$("#contactPopupWrapper").hasClass("hidden")) {
    $("#contactPopupWrapper")
      .css("opacity", 1)
      .animate({ opacity: 0 }, 125, () => {
        $("#contactPopupWrapper").addClass("hidden");
      });
  }
});
