import Ape from "../ape";
import { getHTMLById } from "../controllers/badge-controller";
import * as DB from "../db";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";

let callbackFuncOnHide: (() => void) | null = null;

export function show(callbackOnHide: () => void): void {
  if ($("#editProfilePopupWrapper").hasClass("hidden")) {
    callbackFuncOnHide = callbackOnHide;

    $("#editProfilePopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        hydrateInputs();
      });
  }
}

export function hide(): void {
  if (!$("#editProfilePopupWrapper").hasClass("hidden")) {
    callbackFuncOnHide && callbackFuncOnHide();
    $("#editProfilePopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#editProfilePopupWrapper").addClass("hidden");
        }
      );
  }
}

const bioInput = $("#editProfilePopup .bio");
const keyboardInput = $("#editProfilePopup .keyboard");
const twitterInput = $("#editProfilePopup .twitter");
const githubInput = $("#editProfilePopup .github");
const websiteInput = $("#editProfilePopup .website");
const badgeIdsSelect = $("#editProfilePopup .badge-selection-container");

let currentSelectedBadgeIndex = -1;

function hydrateInputs(): void {
  const snapshot = DB.getSnapshot();
  const badges = snapshot.inventory?.badges ?? [];
  const { bio, keyboard, socialProfiles } = snapshot.details ?? {};

  bioInput.val(bio ?? "");
  keyboardInput.val(keyboard ?? "");
  twitterInput.val(socialProfiles?.twitter ?? "");
  githubInput.val(socialProfiles?.github ?? "");
  websiteInput.val(socialProfiles?.website ?? "");
  badgeIdsSelect.html("");

  const badgeIdsLength = badges?.length ?? 0;

  const selectedBadgeIndex: number | undefined = badges.find(
    (b) => b.selected === true
  )?.id;

  let badgeIndexToSelect = -1;

  if (selectedBadgeIndex !== undefined) {
    badgeIndexToSelect = selectedBadgeIndex;
  } else if (badgeIdsLength !== 0) {
    badgeIndexToSelect = 0;
  }

  currentSelectedBadgeIndex = badgeIndexToSelect;

  badges?.forEach((badge: MonkeyTypes.Badge, i: number) => {
    const badgeOption = getHTMLById(badge.id, false, true);
    const badgeWrapper = `<div class="badge-selection-item ${
      i === badgeIndexToSelect ? "selected" : ""
    }" selection-index=${i}>${badgeOption}</div>`;
    badgeIdsSelect.append(badgeWrapper);
  });

  badgeIdsSelect.prepend(
    `<div class="badge-selection-item ${
      badgeIndexToSelect === -1 ? "selected" : ""
    }" selection-index=${-1}>
      <div class="badge">
        <i class="fas fa-frown-open"></i>
        <div class="text">none</div>
      </div>
    </div>`
  );

  $(".badge-selection-item").on("click", ({ currentTarget }) => {
    const selectionIndex = $(currentTarget).attr("selection-index") as string;
    const selectionIndexInt = parseInt(selectionIndex, 10);
    currentSelectedBadgeIndex = Math.min(selectionIndexInt, badgeIdsLength - 1);

    badgeIdsSelect.find(".badge-selection-item").removeClass("selected");
    $(currentTarget).addClass("selected");
  });
}

function buildUpdatesFromInputs(): MonkeyTypes.UserDetails {
  const bio = (bioInput.val() ?? "") as string;
  const keyboard = (keyboardInput.val() ?? "") as string;
  const twitter = (twitterInput.val() ?? "") as string;
  const github = (githubInput.val() ?? "") as string;
  const website = (websiteInput.val() ?? "") as string;

  const updates: MonkeyTypes.UserDetails = {
    bio,
    keyboard,
    selectedBadgeIndex: currentSelectedBadgeIndex,
    socialProfiles: {
      twitter,
      github,
      website,
    },
  };

  return updates;
}

async function updateProfile(): Promise<void> {
  const updates = buildUpdatesFromInputs();

  Loader.show();
  const response = await Ape.users.updateProfile(updates);
  Loader.hide();

  if (response.status !== 200) {
    Notifications.add("Failed to update profile: " + response.message, -1);
    return;
  }

  const snapshot = DB.getSnapshot();
  snapshot.details = updates;

  Notifications.add("Profile updated", 1);

  hide();
}

$("#editProfilePopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "editProfilePopupWrapper") {
    hide();
  }
});

$("#editProfilePopup .edit-profile-submit").on("click", async () => {
  await updateProfile();
});

$(document).on("keydown", (event) => {
  if (
    event.key === "Escape" &&
    !$("#editProfilePopupWrapper").hasClass("hidden")
  ) {
    hide();
    event.preventDefault();
  }
});
