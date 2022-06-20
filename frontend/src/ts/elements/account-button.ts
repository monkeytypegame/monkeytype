import { Auth } from "../firebase";
import * as Misc from "../utils/misc";

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
    if (discordAvatar && discordId) {
      // Replace font-awesome account icon with Discord avatar only if it loads successfully
      // https://stackoverflow.com/a/5058336/9080819
      const avatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png`;
      $("<img/>")
        .attr("src", avatarUrl)
        .on("load", (event) => {
          $(event.currentTarget).remove();

          usingAvatar = true;
          $("#top #menu .account .avatar").css(
            "background-image",
            `url(${avatarUrl})`
          );

          $("#top #menu .account .icon").addClass("hidden");
          $("#top #menu .account .avatar").removeClass("hidden");
        });
    } else {
      $("#top #menu .account .avatar").addClass("hidden");
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
