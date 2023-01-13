import * as Skeleton from "./skeleton";

const wrapperId = "contactPopupWrapper";

$(document.body).on(
  "click",
  "#contactPopupButton, #contactPopupButton2",
  () => {
    show();
  }
);

$(document.body).on("click", "#contactPopupWrapper", (e) => {
  if ($(e.target).attr("id") === "contactPopupWrapper") {
    hide();
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
    hide();
  }
});

function show(): void {
  Skeleton.append(wrapperId);
  if ($("#contactPopupWrapper").hasClass("hidden")) {
    $("#contactPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100);
  }
}

function hide(): void {
  if (!$("#contactPopupWrapper").hasClass("hidden")) {
    $("#contactPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#contactPopupWrapper").addClass("hidden");
          Skeleton.remove(wrapperId);
        }
      );
  }
}

Skeleton.save(wrapperId);
