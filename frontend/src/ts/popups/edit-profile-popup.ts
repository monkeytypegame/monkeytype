import Ape from "../ape";
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

function hydrateInputs(): void {
  const snapshot = DB.getSnapshot();
  const { bio, keyboard, socialProfiles } = snapshot.details ?? {};

  bioInput.val(bio ?? "");
  keyboardInput.val(keyboard ?? "");
  twitterInput.val(socialProfiles?.twitter ?? "");
  githubInput.val(socialProfiles?.github ?? "");
  websiteInput.val(socialProfiles?.website ?? "");
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
