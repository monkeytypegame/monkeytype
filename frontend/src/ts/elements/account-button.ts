import * as Misc from "../utils/misc";
import {
  getHtmlByUserFlags,
  SupportsFlags,
} from "../controllers/user-flag-controller";
import { isAuthenticated } from "../firebase";
import * as XpBar from "./xp-bar";
import { getAvatarElement } from "../utils/discord-avatar";
import * as AuthEvent from "../observables/auth-event";
import { getSnapshot } from "../db";

export function hide(): void {
  $("nav .accountButtonAndMenu").addClass("hidden");
  $("nav .textButton.view-login").addClass("hidden");
}

export function loading(state: boolean): void {
  $("nav .accountButtonAndMenu .spinner").css({ opacity: state ? "1" : "0" });
  $("nav .accountButtonAndMenu .avatar").css({ opacity: state ? "0" : "1" });
}

export function updateName(name: string): void {
  $("header nav .view-account > .text").text(name);
}

function updateFlags(flags: SupportsFlags): void {
  $("nav .textButton.view-account > .text").append(
    getHtmlByUserFlags(flags, { iconsOnly: true }),
  );
}

export function updateAvatar(avatar?: {
  discordId?: string;
  discordAvatar?: string;
}): void {
  const element = getAvatarElement(avatar ?? {}, {
    userIcon: "fas fa-fw fa-user",
  });
  $("header nav .view-account .avatar").replaceWith(element);
}

export function update(): void {
  if (isAuthenticated()) {
    const snapshot = getSnapshot();

    if (snapshot === undefined) return;

    const { xp, name } = snapshot;

    loading(false);
    updateName(name);
    updateFlags(snapshot ?? {});
    XpBar.setXp(xp);
    updateAvatar(snapshot);

    $("nav .accountButtonAndMenu .menu .items .goToProfile").attr(
      "href",
      `/profile/${name}`,
    );
    void Misc.swapElements(
      document.querySelector("nav .textButton.view-login") as HTMLElement,
      document.querySelector("nav .accountButtonAndMenu") as HTMLElement,
      250,
    );
  } else {
    void Misc.swapElements(
      document.querySelector("nav .accountButtonAndMenu") as HTMLElement,
      document.querySelector("nav .textButton.view-login") as HTMLElement,
      250,
      async () => {
        updateName("");
        updateFlags({});
        XpBar.setXp(0);
        updateAvatar();
      },
    );
  }

  updateFriendRequestsIndicator();
}

export function updateFriendRequestsIndicator(): void {
  const friends = getSnapshot()?.connections;

  if (friends !== undefined) {
    const pendingFriendRequests = Object.values(friends).filter(
      (it) => it === "incoming",
    ).length;
    if (pendingFriendRequests > 0) {
      $("nav .view-account > .notificationBubble").removeClass("hidden");
      $("nav .goToFriends > .notificationBubble")
        .removeClass("hidden")
        .text(pendingFriendRequests);
      return;
    }
  }

  $("nav .view-account > .notificationBubble").addClass("hidden");
  $("nav .goToFriends > .notificationBubble").addClass("hidden");
}

const coarse = window.matchMedia("(pointer:coarse)")?.matches;
if (coarse) {
  $("nav .accountButtonAndMenu .textButton.view-account").attr("href", "");
}

AuthEvent.subscribe((event) => {
  if (
    (event.type === "authStateChanged" && !event.data.isUserSignedIn) ||
    event.type === "snapshotUpdated"
  ) {
    update();
  }
});
