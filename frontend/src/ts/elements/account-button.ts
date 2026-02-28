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
import { qsr } from "../utils/dom";

const nav = qsr("header nav");
const accountButtonAndMenuEl = nav.qsr(".accountButtonAndMenu");
const loginButtonEl = nav.qsr(".textButton.view-login");

export function hide(): void {
  accountButtonAndMenuEl.hide();
  loginButtonEl.hide();
}

export function loading(state: boolean): void {
  accountButtonAndMenuEl
    .qs(".spinner")
    ?.setStyle({ opacity: state ? "1" : "0" });
  accountButtonAndMenuEl
    .qs(".avatar")
    ?.setStyle({ opacity: state ? "0" : "1" });
}

export function updateName(name: string): void {
  accountButtonAndMenuEl.qs(".view-account > .text")?.setText(name);
}

function updateFlags(flags: SupportsFlags): void {
  accountButtonAndMenuEl
    .qs(".view-account > .text")
    ?.appendHtml(getHtmlByUserFlags(flags, { iconsOnly: true }));
}

export function updateAvatar(avatar?: {
  discordId?: string;
  discordAvatar?: string;
}): void {
  const element = getAvatarElement(avatar ?? {}, {
    userIcon: "fas fa-fw fa-user",
  });
  accountButtonAndMenuEl.qs(".avatar")?.replaceWith(element);
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

    accountButtonAndMenuEl
      .qs(".menu .items .goToProfile")
      ?.setAttribute("href", `/profile/${name}`);
    void Misc.swapElements(loginButtonEl, accountButtonAndMenuEl, 250);
  } else {
    void Misc.swapElements(
      accountButtonAndMenuEl,
      loginButtonEl,
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

  const bubbleElements = accountButtonAndMenuEl.qsa(
    ".view-account > .notificationBubble, .goToFriends > .notificationBubble",
  );
  if (friends !== undefined) {
    const pendingFriendRequests = Object.values(friends).filter(
      (it) => it === "incoming",
    ).length;
    if (pendingFriendRequests > 0) {
      bubbleElements.show();
      return;
    }
  }

  bubbleElements.hide();
}

const coarse = window.matchMedia("(pointer:coarse)")?.matches;
if (coarse) {
  accountButtonAndMenuEl.qs(".view-account")?.setAttribute("href", "");
}

AuthEvent.subscribe((event) => {
  if (
    (event.type === "authStateChanged" && !event.data.isUserSignedIn) ||
    event.type === "snapshotUpdated"
  ) {
    update();
  }
});
