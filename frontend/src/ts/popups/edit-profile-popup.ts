import Ape from "../ape";
import { getHTMLById } from "../controllers/badge-controller";
import * as DB from "../db";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import * as ConnectionState from "../states/connection";
import { isPopupVisible } from "../utils/misc";
import * as Skeleton from "./skeleton";

const wrapperId = "editProfilePopupWrapper";

let callbackFuncOnHide: (() => void) | null = null;

export function show(callbackOnHide: () => void): void {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }
  Skeleton.append(wrapperId);

  if (!isPopupVisible(wrapperId)) {
    callbackFuncOnHide = callbackOnHide;

    $("#editProfilePopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {
        hydrateInputs();
      });
  }
}

function hide(): void {
  if (isPopupVisible(wrapperId)) {
    callbackFuncOnHide && callbackFuncOnHide();
    $("#editProfilePopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        125,
        () => {
          $("#editProfilePopupWrapper").addClass("hidden");
          Skeleton.remove(wrapperId);
        }
      );
  }
}

const bioInput = $("#editProfilePopup .bio");
const keyboardInput = $("#editProfilePopup .keyboard");
const twitterInput = $("#editProfilePopup .twitter");
const githubInput = $("#editProfilePopup .github");
const websiteInput = $("#editProfilePopup .website");
const badgeIdsSelect = $("#editProfilePopup .badgeSelectionContainer");

let currentSelectedBadgeId = -1;

function hydrateInputs(): void {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;
  const badges = snapshot.inventory?.badges ?? [];
  const { bio, keyboard, socialProfiles } = snapshot.details ?? {};
  currentSelectedBadgeId = -1;

  bioInput.val(bio ?? "");
  keyboardInput.val(keyboard ?? "");
  twitterInput.val(socialProfiles?.twitter ?? "");
  githubInput.val(socialProfiles?.github ?? "");
  websiteInput.val(socialProfiles?.website ?? "");
  badgeIdsSelect.html("");

  badges?.forEach((badge: MonkeyTypes.Badge) => {
    if (badge.selected) {
      currentSelectedBadgeId = badge.id;
    }

    const badgeOption = getHTMLById(badge.id, false, true);
    const badgeWrapper = `<div class="badgeSelectionItem ${
      badge.selected ? "selected" : ""
    }" selection-id=${badge.id}>${badgeOption}</div>`;
    badgeIdsSelect.append(badgeWrapper);
  });

  badgeIdsSelect.prepend(
    `<div class="badgeSelectionItem ${
      currentSelectedBadgeId === -1 ? "selected" : ""
    }" selection-id=${-1}>
      <div class="badge">
        <i class="fas fa-frown-open"></i>
        <div class="text">none</div>
      </div>
    </div>`
  );

  $(".badgeSelectionItem").on("click", ({ currentTarget }) => {
    const selectionId = $(currentTarget).attr("selection-id") as string;
    currentSelectedBadgeId = parseInt(selectionId, 10);

    badgeIdsSelect.find(".badgeSelectionItem").removeClass("selected");
    $(currentTarget).addClass("selected");
  });
}

function buildUpdatesFromInputs(): MonkeyTypes.UserDetails {
  const bio = (bioInput.val() ?? "") as string;
  const keyboard = (keyboardInput.val() ?? "") as string;
  const twitter = (twitterInput.val() ?? "") as string;
  const github = (githubInput.val() ?? "") as string;
  const website = (websiteInput.val() ?? "") as string;

  const profileUpdates: MonkeyTypes.UserDetails = {
    bio,
    keyboard,
    socialProfiles: {
      twitter,
      github,
      website,
    },
  };

  return profileUpdates;
}

async function updateProfile(): Promise<void> {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;
  const updates = buildUpdatesFromInputs();

  // check for length resctrictions before sending server requests
  const githubLengthLimit = 39;
  if (
    updates.socialProfiles.github &&
    updates.socialProfiles.github.length > githubLengthLimit
  ) {
    Notifications.add(
      `GitHub username exceeds maximum allowed length (${githubLengthLimit} characters).`,
      -1
    );
    return;
  }

  const twitterLengthLimit = 20;
  if (
    updates.socialProfiles.twitter &&
    updates.socialProfiles.twitter.length > twitterLengthLimit
  ) {
    Notifications.add(
      `Twitter username exceeds maximum allowed length (${twitterLengthLimit} characters).`,
      -1
    );
    return;
  }

  Loader.show();
  const response = await Ape.users.updateProfile(
    updates,
    currentSelectedBadgeId
  );
  Loader.hide();

  if (response.status !== 200) {
    Notifications.add("Failed to update profile: " + response.message, -1);
    return;
  }

  snapshot.details = updates;
  snapshot.inventory?.badges.forEach((badge) => {
    if (badge.id === currentSelectedBadgeId) {
      badge.selected = true;
    } else {
      delete badge.selected;
    }
  });

  Notifications.add("Profile updated", 1);

  hide();
}

$("#editProfilePopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "editProfilePopupWrapper") {
    hide();
  }
});

$("#editProfilePopupWrapper .edit-profile-submit").on("click", async () => {
  await updateProfile();
});

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && isPopupVisible(wrapperId)) {
    hide();
    event.preventDefault();
  }
});

Skeleton.save(wrapperId);
