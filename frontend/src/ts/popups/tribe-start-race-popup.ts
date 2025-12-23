import tribeSocket from "../tribe/tribe-socket";

export function show(): void {
  if ($("#tribeStartRacePopupWrapper").hasClass("hidden")) {
    $("#tribeStartRacePopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {
        /* noop */
      });
  }
}

export function hide(): void {
  if (!$("#tribeStartRacePopupWrapper").hasClass("hidden")) {
    $("#tribeStartRacePopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#tribeStartRacePopupWrapper").addClass("hidden");
        },
      );
  }
}

$("#tribeStartRacePopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "tribeStartRacePopupWrapper") {
    hide();
  }
});

$("#tribeStartRacePopup .button").on("click", () => {
  tribeSocket.out.room.initRace();
  hide();
});

$(document).on("keypress", (e) => {
  if (
    e.key === "Enter" &&
    !$("#tribeStartRacePopupWrapper").hasClass("hidden")
  ) {
    tribeSocket.out.room.initRace();
    hide();
    e.preventDefault();
  }
});
