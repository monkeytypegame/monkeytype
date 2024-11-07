import * as Misc from "../utils/misc";
import {
  getHtmlByUserFlags,
  SupportsFlags,
} from "../controllers/user-flag-controller";
import { isAuthenticated } from "../firebase";
import { Snapshot } from "../db";
import * as XpBar from "./xp-bar";

let usingAvatar = false;

export function hide(): void {
  $("nav .accountButtonAndMenu").addClass("hidden");
  $("nav .textButton.view-login").addClass("hidden");
}

export function loading(state: boolean): void {
  if (state) {
    $("header nav .account").css("opacity", 1).css("pointer-events", "none");

    if (usingAvatar) {
      $("header nav .view-account .loading")
        .css("opacity", 1)
        .removeClass("hidden");
      $("header nav .view-account .avatar")
        .stop(true, true)
        .css({ opacity: 1 })
        .animate(
          {
            opacity: 0,
          },
          100,
          () => {
            $("header nav .view-account .avatar").addClass("hidden");
          }
        );
    } else {
      $("header nav .view-account .loading")
        .stop(true, true)
        .removeClass("hidden")
        .css({ opacity: 0 })
        .animate(
          {
            opacity: 1,
          },
          100
        );
      $("header nav .view-account .user")
        .stop(true, true)
        .css({ opacity: 1 })
        .animate(
          {
            opacity: 0,
          },
          100,
          () => {
            $("header nav .view-account .user").addClass("hidden");
          }
        );
    }
  } else {
    $("header nav .account").css("opacity", 1).css("pointer-events", "auto");

    if (usingAvatar) {
      $("header nav .view-account .loading")
        .css("opacity", 1)
        .addClass("hidden");
      $("header nav .view-account .avatar")
        .stop(true, true)
        .removeClass("hidden")
        .css({ opacity: 0 })
        .animate(
          {
            opacity: 1,
          },
          100
        );
    } else {
      $("header nav .view-account .loading")
        .stop(true, true)
        .css({ opacity: 1 })
        .animate(
          {
            opacity: 0,
          },
          100,
          () => {
            $("header nav .view-account .loading").addClass("hidden");
          }
        );
      $("header nav .view-account .user")
        .stop(true, true)
        .removeClass("hidden")
        .css({ opacity: 0 })
        .animate(
          {
            opacity: 1,
          },
          100
        );
    }
  }
}

export function updateName(name: string): void {
  $("header nav .view-account > .text").text(name);
}

function updateFlags(flags: SupportsFlags): void {
  $("nav .textButton.view-account > .text").append(
    getHtmlByUserFlags(flags, { iconsOnly: true })
  );
}

export function updateAvatar(
  discordId: string | undefined,
  discordAvatar: string | undefined
): void {
  if ((discordAvatar ?? "") && (discordId ?? "")) {
    void Misc.getDiscordAvatarUrl(discordId, discordAvatar).then(
      (discordAvatarUrl) => {
        if (discordAvatarUrl !== null) {
          $("header nav .view-account .avatar").css(
            "background-image",
            `url(${discordAvatarUrl})`
          );
          usingAvatar = true;

          $("header nav .view-account .user").addClass("hidden");
          $("header nav .view-account .avatar").removeClass("hidden");
        }
      }
    );
  } else {
    $("header nav .view-account .avatar").addClass("hidden");
    $("header nav .view-account .user").removeClass("hidden");
    $("header nav .view-account .avatar").css("background-image", "");
    usingAvatar = false;
  }
}

export function update(snapshot: Snapshot | undefined): void {
  if (isAuthenticated()) {
    // this function is called after the snapshot is loaded (awaited), so it should be fine
    const { xp, discordId, discordAvatar, name } = snapshot as Snapshot;

    updateName(name);
    updateFlags(snapshot ?? {});
    XpBar.setXp(xp);
    updateAvatar(discordId ?? "", discordAvatar ?? "");

    $("nav .accountButtonAndMenu .menu .items .goToProfile").attr(
      "href",
      `/profile/${name}`
    );
    void Misc.swapElements(
      $("nav .textButton.view-login"),
      $("nav .accountButtonAndMenu"),
      250
    );
  } else {
    void Misc.swapElements(
      $("nav .accountButtonAndMenu"),
      $("nav .textButton.view-login"),
      250,
      async () => {
        updateName("");
        updateFlags({});
        XpBar.setXp(0);
        updateAvatar(undefined, undefined);
      }
    );
  }
}

const coarse = window.matchMedia("(pointer:coarse)")?.matches;
if (coarse) {
  $("nav .accountButtonAndMenu .textButton.view-account").attr("href", "");
}
