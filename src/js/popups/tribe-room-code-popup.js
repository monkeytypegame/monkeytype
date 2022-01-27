import * as Tribe from "./tribe";
import * as Notifications from "./notifications";

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
      !e.metaKey &&
      !e.shiftKey &&
      !/[0-9a-fA-F]/.test(e.key)) ||
    (e.key.length == 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
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

$("#tribeRoomCodePopup .icon-button").click(async (e) => {
  try {
    let text = await navigator.clipboard.readText();
    Tribe.joinRoom(text);
    hide();
  } catch (e) {
    Notifications.add(
      "Something went wrong when trying to paste: " + e.message,
      -1
    );
  }
});

$("#tribeRoomCodePopupWrapper").click((e) => {
  if ($(e.target).attr("id") === "tribeRoomCodePopupWrapper") {
    hide();
  }
});
