export function show(): void {
  $("#versionHistoryWrapper")
    .css("opacity", 0)
    .removeClass("hidden")
    .animate({ opacity: 1 }, 125);
}

$(document.body).on("click", ".version", () => {
  show();
});

$(document.body).on("click", "#versionHistoryWrapper", (e) => {
  if ($(e.target).attr("id") === "versionHistoryWrapper") {
    $("#versionHistoryWrapper")
      .css("opacity", 1)
      .animate({ opacity: 0 }, 125, () => {
        $("#versionHistoryWrapper").addClass("hidden");
      });
  }
});
