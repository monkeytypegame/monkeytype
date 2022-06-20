import { Auth } from "../firebase";
import * as Misc from "../utils/misc";
import { loadDiscordAvatar } from "../utils/load-discord-avatar";

let usingAvatar = false;

export function loading(truefalse: boolean): void {
  if (truefalse) {
    if (usingAvatar) {
      $("#top #menu .account .avatar").addClass("hidden");
    }
    $("#top #menu .account .icon").html(
      '<i class="fas fa-fw fa-spin fa-circle-notch"></i>'
    );
    $("#top #menu .account").css("opacity", 1).css("pointer-events", "none");
  } else {
    if (usingAvatar) {
      $("#top #menu .account .avatar").removeClass("hidden");
    }
    $("#top #menu .account .icon").html('<i class="fas fa-fw fa-user"></i>');
    $("#top #menu .account").css("opacity", 1).css("pointer-events", "auto");
  }
}

export function update(discordId?: string, discordAvatar?: string): void {
  if (Auth.currentUser != null) {
    loadDiscordAvatar(discordId, discordAvatar)
      .then((avatarUrl) => {
        usingAvatar = true;

        $("#top #menu .account .avatar").css(
          "background-image",
          `url(${avatarUrl})`
        );

        $("#top #menu .account .icon").addClass("hidden");
        $("#top #menu .account .avatar").removeClass("hidden");
      })
      .catch(() => {
        usingAvatar = false;
      });
    Misc.swapElements(
      $("#menu .text-button.login"),
      $("#menu .text-button.account"),
      250
    );
  } else {
    Misc.swapElements(
      $("#menu .text-button.account"),
      $("#menu .text-button.login"),
      250
    );
  }
}
