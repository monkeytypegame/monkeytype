import * as Tribe from "./tribe";
import * as Notifications from "./notifications";

export function init() {
  let link = location.origin + "/tribe_" + Tribe.room.id;
  $(".pageTribe .tribePage.lobby .inviteLink .code .text").text(Tribe.room.id);
  $(".pageTribe .tribePage.lobby .inviteLink .link").text(link);
}

$(".pageTribe .tribePage.lobby .inviteLink .text").hover(
  function () {
    $(this).css(
      "color",
      "#" + $(".pageTribe .tribePage.lobby .inviteLink .text").text()
    );
  },
  function () {
    $(this).css("color", "");
  }
);

$(".pageTribe .tribePage.lobby .inviteLink .text").click(async (e) => {
  try {
    await navigator.clipboard.writeText(
      $(".pageTribe .tribePage.lobby .inviteLink .text").text()
    );
    Notifications.add("Code copied", 1);
  } catch (e) {
    Notifications.add("Could not copy to clipboard: " + e, -1);
  }
});

$(".pageTribe .tribePage.lobby .inviteLink .link").click(async (e) => {
  try {
    await navigator.clipboard.writeText(
      $(".pageTribe .tribePage.lobby .inviteLink .link").text()
    );
    Notifications.add("Link copied", 1);
  } catch (e) {
    Notifications.add("Could not copy to clipboard: " + e, -1);
  }
});
