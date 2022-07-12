function show(): void {
  if ($("#videoAdPopupWrapper").hasClass("hidden")) {
    $("#videoAdPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        //@ts-ignore
        window.dataLayer.push({ event: "EG_Video" });
      });
  }
}

function hide(): void {
  if (!$("#videoAdPopupWrapper").hasClass("hidden")) {
    $("#videoAdPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#videoAdPopupWrapper").addClass("hidden");
        }
      );
  }
}

$(".pageTest #watchVideoAdButton").on("click", () => {
  show();
});

$("#videoAdPopup .button").on("click", () => {
  hide();
});
