import * as Tribe from "../tribe/tribe";
import * as Notifications from "../elements/notifications";

export function show(): void {
  if ($("#tribeRoomCodePopupWrapper").hasClass("hidden")) {
    $("#tribeRoomCodePopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {
        $("#tribeRoomCodePopup input").trigger("focus");
        $("#tribeRoomCodePopup input").val("");
      });
  }
}

function hide(): void {
  if (!$("#tribeRoomCodePopupWrapper").hasClass("hidden")) {
    $("#tribeRoomCodePopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#tribeRoomCodePopupWrapper").addClass("hidden");
        },
      );
  }
}

$("#tribeRoomCodePopup input").on("keydown", (e) => {
  if (
    (e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.shiftKey &&
      !/[0-9a-fA-F]/.test(e.key)) ||
    (e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.shiftKey &&
      /[0-9a-fA-F]/.test(e.key) &&
      ($("#tribeRoomCodePopup input").val() as string).length >= 6)
  ) {
    e.preventDefault();
  } else if (e.key === "Enter") {
    Tribe.joinRoom($("#tribeRoomCodePopup input").val() as string);
    hide();
  }
});

$("#tribeRoomCodePopup .button").on("click", () => {
  Tribe.joinRoom($("#tribeRoomCodePopup input").val() as string);
  hide();
});

$("#tribeRoomCodePopup .textButton").on("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    Tribe.joinRoom(text);
    hide();
  } catch (e) {
    Notifications.add(
      "Something went wrong when trying to paste: " + (e as Error).message,
      -1,
    );
  }
});

$("#tribeRoomCodePopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "tribeRoomCodePopupWrapper") {
    hide();
  }
});

$(".pageTribe .menu .customRooms #enterRoomCode").on("click", (e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  show();
});
