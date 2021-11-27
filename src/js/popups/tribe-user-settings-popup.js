import * as Tribe from "./tribe";
import * as Notifications from "./notifications";

export function show(userId) {
  if (!userId)
    return Notifications.add(
      "Cannot show user settings without passing in user id",
      -1
    );
  if ($("#tribeUserSettingsPopupWrapper").hasClass("hidden")) {
    $("#tribeUserSettingsPopup .title").text(
      `User settings (${Tribe.room.users[userId].name})`
    );
    $("#tribeUserSettingsPopup").attr("userid", userId);
    $("#tribeUserSettingsPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {});
  }
}

export function hide() {
  if (!$("#tribeUserSettingsPopupWrapper").hasClass("hidden")) {
    $("#tribeUserSettingsPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#tribeUserSettingsPopupWrapper").addClass("hidden");
        }
      );
  }
}

$("#tribeUserSettingsPopupWrapper").click((e) => {
  if ($(e.target).attr("id") === "tribeUserSettingsPopupWrapper") {
    hide();
  }
});

$("#tribeUserSettingsPopup .button.banButton").click((e) => {
  let userId = $("#tribeUserSettingsPopup").attr("userid");
  Tribe.socket.emit("room_ban_user", {
    userId: userId,
  });
  hide();
});

$("#tribeUserSettingsPopup .button.giveLeaderButton").click((e) => {
  let userId = $("#tribeUserSettingsPopup").attr("userid");
  Tribe.socket.emit("room_give_leader", {
    userId: userId,
  });
  hide();
});
