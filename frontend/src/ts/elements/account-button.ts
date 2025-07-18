import * as Misc from "../utils/misc";
import {
  getHtmlByUserFlags,
  SupportsFlags,
} from "../controllers/user-flag-controller";
import { isAuthenticated } from "../firebase";
import * as XpBar from "./xp-bar";
import { Snapshot } from "../constants/default-snapshot";
import { getAvatarElement } from "../utils/discord-avatar";

export function hide(): void {
  $("nav .accountButtonAndMenu").addClass("hidden");
  $("nav .textButton.view-login").addClass("hidden");
}

export function loading(state: boolean): void {
  $("nav .accountButtonAndMenu .loading").css({ opacity: state ? "1" : "0" });
  $(
    "nav .accountButtonAndMenu .avatar,nav .accountButtonAndMenu .avatarPlaceholder"
  ).css({ opacity: state ? "0" : "1" });
}

export function updateName(name: string): void {
  $("header nav .view-account > .text").text(name);
}

function updateFlags(flags: SupportsFlags): void {
  $("nav .textButton.view-account > .text").append(
    getHtmlByUserFlags(flags, { iconsOnly: true })
  );
}

export function updateAvatar(avatar?: {
  discordId?: string;
  discordAvatar?: string;
}): void {
  $(
    "header nav .view-account .avatar, header nav .view-account .avatarPlaceholder"
  ).replaceWith(getAvatarElement(avatar ?? {}));
}

export function update(snapshot: Snapshot | undefined): void {
  if (isAuthenticated()) {
    // this function is called after the snapshot is loaded (awaited), so it should be fine
    const { xp, name } = snapshot as Snapshot;

    updateName(name);
    updateFlags(snapshot ?? {});
    XpBar.setXp(xp);
    updateAvatar(snapshot);

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
        updateAvatar();
      }
    );
  }
}

const coarse = window.matchMedia("(pointer:coarse)")?.matches;
if (coarse) {
  $("nav .accountButtonAndMenu .textButton.view-account").attr("href", "");
}
