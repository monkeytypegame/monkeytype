import Ape from "../ape";
import { getHTMLById } from "../controllers/badge-controller";
import * as DB from "../db";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import * as ConnectionState from "../states/connection";
import AnimatedModal from "../utils/animated-modal";
import * as Profile from "../elements/profile";
import { CharacterCounter } from "../elements/character-counter";
import { Badge, UserProfileDetails } from "@monkeytype/contracts/schemas/users";

export function show(): void {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }

  void modal.show({
    beforeAnimation: async () => {
      hydrateInputs();
      initializeCharacterCounters();
    },
  });
}

function hide(): void {
  void modal.hide({
    afterAnimation: async () => {
      const snapshot = DB.getSnapshot();
      if (!snapshot) return;
      void Profile.update("account", snapshot);
    },
  });
}

const bioInput: JQuery<HTMLTextAreaElement> = $("#editProfileModal .bio");
const keyboardInput: JQuery<HTMLTextAreaElement> = $(
  "#editProfileModal .keyboard"
);
const twitterInput = $("#editProfileModal .twitter");
const githubInput = $("#editProfileModal .github");
const websiteInput = $("#editProfileModal .website");
const badgeIdsSelect = $("#editProfileModal .badgeSelectionContainer");

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

  badges?.forEach((badge: Badge) => {
    if (badge.selected) {
      currentSelectedBadgeId = badge.id;
    }

    const badgeOption = getHTMLById(badge.id, false, true);
    const badgeWrapper = `<button type="button" class="badgeSelectionItem ${
      badge.selected ? "selected" : ""
    }" selection-id=${badge.id}>${badgeOption}</button>`;
    badgeIdsSelect.append(badgeWrapper);
  });

  badgeIdsSelect.prepend(
    `<button type="button" class="badgeSelectionItem ${
      currentSelectedBadgeId === -1 ? "selected" : ""
    }" selection-id=${-1}>
      <div class="badge">
        <i class="fas fa-frown-open"></i>
        <div class="text">none</div>
      </div>
    </button>`
  );

  $(".badgeSelectionItem").on("click", ({ currentTarget }) => {
    const selectionId = $(currentTarget).attr("selection-id") as string;
    currentSelectedBadgeId = parseInt(selectionId, 10);

    badgeIdsSelect.find(".badgeSelectionItem").removeClass("selected");
    $(currentTarget).addClass("selected");
  });
}

function initializeCharacterCounters(): void {
  new CharacterCounter(bioInput, 250);
  new CharacterCounter(keyboardInput, 75);
}

function buildUpdatesFromInputs(): UserProfileDetails {
  const bio = (bioInput.val() ?? "") as string;
  const keyboard = (keyboardInput.val() ?? "") as string;
  const twitter = (twitterInput.val() ?? "") as string;
  const github = (githubInput.val() ?? "") as string;
  const website = (websiteInput.val() ?? "") as string;

  const profileUpdates: UserProfileDetails = {
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
    updates.socialProfiles?.github !== undefined &&
    updates.socialProfiles?.github.length > githubLengthLimit
  ) {
    Notifications.add(
      `GitHub username exceeds maximum allowed length (${githubLengthLimit} characters).`,
      -1
    );
    return;
  }

  const twitterLengthLimit = 20;
  if (
    updates.socialProfiles?.twitter !== undefined &&
    updates.socialProfiles?.twitter.length > twitterLengthLimit
  ) {
    Notifications.add(
      `Twitter username exceeds maximum allowed length (${twitterLengthLimit} characters).`,
      -1
    );
    return;
  }

  Loader.show();
  const response = await Ape.users.updateProfile({
    body: {
      ...updates,
      selectedBadgeId: currentSelectedBadgeId,
    },
  });
  Loader.hide();

  if (response.status !== 200) {
    Notifications.add("Failed to update profile: " + response.body.message, -1);
    return;
  }

  snapshot.details = response.body.data ?? updates;
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

const modal = new AnimatedModal({
  dialogId: "editProfileModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      await updateProfile();
    });
  },
});
