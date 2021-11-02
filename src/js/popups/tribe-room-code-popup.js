import * as Tribe from "./tribe";

export function show() {
  if ($("#tribeRoomCodePopupWrapper").hasClass("hidden")) {
    $("#tribeRoomCodePopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {
        $("#tribeRoomCodePopup input").focus();
        $("#tribeRoomCodePopup input").val("");
      });
  }
}

function hide() {
  if (!$("#tribeRoomCodePopupWrapper").hasClass("hidden")) {
    $("#tribeRoomCodePopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#tribeRoomCodePopupWrapper").addClass("hidden");
        }
      );
  }
}

$("#tribeRoomCodePopup input").keydown((e) => {
  if (
    (e.key.length == 1 &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !/[0-9a-fA-F]/.test(e.key)) ||
    (e.key.length == 1 &&
      !e.ctrlKey &&
      !e.shiftKey &&
      /[0-9a-fA-F]/.test(e.key) &&
      $("#tribeRoomCodePopup input").val().length >= 6)
  ) {
    e.preventDefault();
  } else if (e.key === "Enter") {
    Tribe.joinRoom($("#tribeRoomCodePopup input").val());
    hide();
  }
});

$("#tribeRoomCodePopup .button").click((e) => {
  Tribe.joinRoom($("#tribeRoomCodePopup input").val());
  hide();
});
