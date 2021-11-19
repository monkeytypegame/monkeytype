import * as Tribe from "./tribe";
import * as Notifications from "./notifications";

export function show() {
  if ($("#tribeStarRacePopupWrapper").hasClass("hidden")) {
    $("#tribeStarRacePopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {});
  }
}

export function hide() {
  if (!$("#tribeStarRacePopupWrapper").hasClass("hidden")) {
    $("#tribeStarRacePopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#tribeStarRacePopupWrapper").addClass("hidden");
        }
      );
  }
}

$("#tribeStarRacePopupWrapper").click((e) => {
  if ($(e.target).attr("id") === "tribeStarRacePopupWrapper") {
    hide();
  }
});

$("#tribeStartRacePopup .button").click((e) => {
  Tribe.socket.emit("room_init_race");
  hide();
});

$(document).on("keypress", (e) => {
  if (
    e.key === "Enter" &&
    !$("#tribeStarRacePopupWrapper").hasClass("hidden")
  ) {
    Tribe.socket.emit("room_init_race");
    hide();
    e.preventDefault();
  }
});
