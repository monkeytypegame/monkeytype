import * as Tribe from "./tribe";

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
        }
      );
  }
}

$("#tribeStartRacePopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "tribeStartRacePopupWrapper") {
    hide();
  }
});

$("#tribeStartRacePopup .button").on("click", () => {
  Tribe.socket.emit("room_init_race");
  hide();
});

$(document).on("keypress", (e) => {
  if (
    e.key === "Enter" &&
    !$("#tribeStartRacePopupWrapper").hasClass("hidden")
  ) {
    Tribe.socket.emit("room_init_race");
    hide();
    e.preventDefault();
  }
});
