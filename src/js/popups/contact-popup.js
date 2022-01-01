$(document.body).on("click", "#contactPopupButton", () => {
  $("#contactPopupWrapper")
    .css("opacity", 0)
    .removeClass("hidden")
    .animate({ opacity: 1 }, 125);
});

$(document.body).on("click", "#contactPopupWrapper", (e) => {
  if ($(e.target).attr("id") === "contactPopupWrapper") {
    $("#contactPopupWrapper")
      .css("opacity", 1)
      .animate({ opacity: 0 }, 125, () => {
        $("#contactPopupWrapper").addClass("hidden");
      });
  }
});
