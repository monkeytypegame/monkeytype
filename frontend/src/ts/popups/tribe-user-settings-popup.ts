import * as TribeState from "../tribe/tribe-state";
import * as Notifications from "../elements/notifications";
import tribeSocket from "../tribe/tribe-socket";

export function show(userId: string): void {
  if (!userId) {
    Notifications.add(
      "Cannot show user settings without passing in user id",
      -1,
    );
    return;
  }
  if ($("#tribeUserSettingsPopupWrapper").hasClass("hidden")) {
    $("#tribeUserSettingsPopup .title").text(
      `User settings (${TribeState.getRoom()?.users[userId]?.name})`,
    );
    $("#tribeUserSettingsPopup").attr("userid", userId);
    $("#tribeUserSettingsPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, (): void => {
        /* noop */
      });
  }
}

export function hide(): void {
  if (!$("#tribeUserSettingsPopupWrapper").hasClass("hidden")) {
    $("#tribeUserSettingsPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (): void => {
          $("#tribeUserSettingsPopupWrapper").addClass("hidden");
        },
      );
  }
}

$("#tribeUserSettingsPopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "tribeUserSettingsPopupWrapper") {
    hide();
  }
});

$("#tribeUserSettingsPopup .button.banButton").on("click", () => {
  const userId = $("#tribeUserSettingsPopup").attr("userid");
  if (userId === undefined) return;
  tribeSocket.out.room.banUser(userId);
  hide();
});

$("#tribeUserSettingsPopup .button.giveLeaderButton").on("click", () => {
  const userId = $("#tribeUserSettingsPopup").attr("userid");
  if (userId === undefined) return;
  tribeSocket.out.room.giveLeader(userId);
  hide();
});
