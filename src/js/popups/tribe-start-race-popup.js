import * as Tribe from "./tribe";
import * as Notifications from "./notifications";

export function show() {
  if ($("#tribeStartRacePopupWrapper").hasClass("hidden")) {
    $("#tribeStartRacePopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {});
  }
}

export function hide() {
  if (!$("#tribeStartRacePopupWrapper").hasClass("hidden")) {
    $("#tribeStartRacePopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#tribeStartRacePopupWrapper").addClass("hidden");
        }
      );
  }
}

$("#tribeStartRacePopupWrapper").click((e) => {
  if ($(e.target).attr("id") === "tribeStartRacePopupWrapper") {
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
    !$("#tribeStartRacePopupWrapper").hasClass("hidden")
  ) {
    Tribe.socket.emit("room_init_race");
    hide();
    e.preventDefault();
  }
});
