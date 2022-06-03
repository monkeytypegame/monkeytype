import { Auth } from "../firebase";
import * as Misc from "../utils/misc";

let usingAvatar = false;

export function loading(truefalse: boolean): void {
  if (truefalse) {
    if (usingAvatar) {
      $("#top #menu .account .avatar").addClass("hidden");
      $("#top #menu .account .icon").removeClass("hidden");
    }
    $("#top #menu .account .icon").html(
      '<i class="fas fa-fw fa-spin fa-circle-notch"></i>'
    );
    $("#top #menu .account").css("opacity", 1).css("pointer-events", "none");
  } else {
    if (usingAvatar) {
      $("#top #menu .account .avatar").removeClass("hidden");
      $("#top #menu .account .icon").addClass("hidden");
    }
    $("#top #menu .account .icon").html('<i class="fas fa-fw fa-user"></i>');
    $("#top #menu .account").css("opacity", 1).css("pointer-events", "auto");
  }
}

export function update(discordId?: string, discordAvatar?: string): void {
  if (Auth.currentUser != null) {
    if (discordAvatar && discordId) {
      usingAvatar = true;
      $("#top #menu .account .avatar").css(
        "background-image",
        `url(https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png)`
      );
      $("#top #menu .account .avatar").removeClass("hidden");
      $("#top #menu .account .icon").addClass("hidden");
    }
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
