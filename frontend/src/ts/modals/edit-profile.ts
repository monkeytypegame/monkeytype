import Ape from "../ape";
import { getHTMLById } from "../controllers/badge-controller";
import * as DB from "../db";

import { showLoaderBar, hideLoaderBar } from "../signals/loader-bar";
import * as Notifications from "../elements/notifications";
import AnimatedModal from "../utils/animated-modal";
import * as Profile from "../elements/profile";
import { CharacterCounter } from "../elements/character-counter";
import {
  Badge,
  GithubProfileSchema,
  TwitterProfileSchema,
  UserProfileDetails,
  WebsiteSchema,
} from "@monkeytype/schemas/users";
import { InputIndicator } from "../elements/input-indicator";
import { ElementWithUtils, qsr } from "../utils/dom";

export function show(): void {
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

const bioInput = qsr<HTMLTextAreaElement>("#editProfileModal .bio");
const keyboardInput = qsr<HTMLTextAreaElement>("#editProfileModal .keyboard");
const twitterInput = qsr<HTMLInputElement>("#editProfileModal .twitter");
const githubInput = qsr<HTMLInputElement>("#editProfileModal .github");
const websiteInput = qsr<HTMLInputElement>("#editProfileModal .website");
const badgeIdsSelect = qsr("#editProfileModal .badgeSelectionContainer");
const showActivityOnPublicProfileInput = qsr<HTMLInputElement>(
  "#editProfileModal .editProfileShowActivityOnPublicProfile",
);

const indicators = [
  addValidation(twitterInput, TwitterProfileSchema),
  addValidation(githubInput, GithubProfileSchema),
  addValidation(websiteInput, WebsiteSchema),
];

let currentSelectedBadgeId = -1;

function hydrateInputs(): void {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;
  const badges = snapshot.inventory?.badges ?? [];
  const { bio, keyboard, socialProfiles, showActivityOnPublicProfile } =
    snapshot.details ?? {};
  currentSelectedBadgeId = -1;

  bioInput.setValue(bio ?? "");
  keyboardInput.setValue(keyboard ?? "");
  twitterInput.setValue(socialProfiles?.twitter ?? "");
  githubInput.setValue(socialProfiles?.github ?? "");
  websiteInput.setValue(socialProfiles?.website ?? "");
  badgeIdsSelect.setHtml("");
  showActivityOnPublicProfileInput.native.checked =
    showActivityOnPublicProfile ?? false;

  badges?.forEach((badge: Badge) => {
    if (badge.selected) {
      currentSelectedBadgeId = badge.id;
    }

    const badgeOption = getHTMLById(badge.id, false, true);
    const badgeWrapper = `<button type="button" class="badgeSelectionItem ${
      badge.selected ? "selected" : ""
    }" selection-id=${badge.id}>${badgeOption}</button>`;
    badgeIdsSelect?.appendHtml(badgeWrapper);
  });

  badgeIdsSelect?.prependHtml(
    `<button type="button" class="badgeSelectionItem ${
      currentSelectedBadgeId === -1 ? "selected" : ""
    }" selection-id=${-1}>
      <div class="badge">
        <i class="fas fa-frown-open"></i>
        <div class="text">none</div>
      </div>
    </button>`,
  );

  badgeIdsSelect
    ?.qsa(".badgeSelectionItem")
    ?.on("click", ({ currentTarget }) => {
      const selectionId = (currentTarget as HTMLElement).getAttribute(
        "selection-id",
      ) as string;
      currentSelectedBadgeId = parseInt(selectionId, 10);

      badgeIdsSelect?.qsa(".badgeSelectionItem")?.removeClass("selected");
      (currentTarget as HTMLElement).classList.add("selected");
    });

  indicators.forEach((it) => it.hide());
}

function initializeCharacterCounters(): void {
  new CharacterCounter(bioInput, 250);
  new CharacterCounter(keyboardInput, 75);
}

function buildUpdatesFromInputs(): UserProfileDetails {
  const bio = bioInput.getValue() ?? "";
  const keyboard = keyboardInput.getValue() ?? "";
  const twitter = twitterInput.getValue() ?? "";
  const github = githubInput.getValue() ?? "";
  const website = websiteInput.getValue() ?? "";
  const showActivityOnPublicProfile =
    showActivityOnPublicProfileInput.isChecked() ?? false;

  const profileUpdates: UserProfileDetails = {
    bio,
    keyboard,
    socialProfiles: {
      twitter,
      github,
      website,
    },
    showActivityOnPublicProfile,
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
      -1,
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
      -1,
    );
    return;
  }

  showLoaderBar();
  const response = await Ape.users.updateProfile({
    body: {
      ...updates,
      selectedBadgeId: currentSelectedBadgeId,
    },
  });
  hideLoaderBar();

  if (response.status !== 200) {
    Notifications.add("Failed to update profile", -1, { response });
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

function addValidation(
  element: ElementWithUtils<HTMLInputElement>,
  schema: Zod.Schema,
): InputIndicator {
  const indicator = new InputIndicator(element, {
    valid: {
      icon: "fa-check",
      level: 1,
    },
    invalid: {
      icon: "fa-times",
      level: -1,
    },
    checking: {
      icon: "fa-circle-notch",
      spinIcon: true,
      level: 0,
    },
  });

  element.on("input", (event) => {
    const value = (event.target as HTMLInputElement).value;
    if (value === undefined || value === "") {
      indicator.hide();
      return;
    }
    const validationResult = schema.safeParse(value);
    if (!validationResult.success) {
      indicator.show(
        "invalid",
        validationResult.error.errors.map((err) => err.message).join(", "),
      );
      return;
    }
    indicator.show("valid");
  });
  return indicator;
}

const modal = new AnimatedModal({
  dialogId: "editProfileModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.on("submit", async (e) => {
      e.preventDefault();
      await updateProfile();
    });
  },
});
