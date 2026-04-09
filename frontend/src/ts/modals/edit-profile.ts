import Ape from "../ape";
import { getHTMLById } from "../controllers/badge-controller";
import * as DB from "../db";

import { showLoaderBar, hideLoaderBar } from "../states/loader-bar";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../states/notifications";
import AnimatedModal from "../utils/animated-modal";
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
      originalState = getProfileState();
      updateSaveButtonState();
      initializeCharacterCounters();
    },
  });
}

function hide(): void {
  void modal.hide();
}

const saveButton = qsr<HTMLButtonElement>(
  "#editProfileModal .edit-profile-submit",
);

const bioInput = qsr<HTMLTextAreaElement>("#editProfileModal .bio");
const keyboardInput = qsr<HTMLTextAreaElement>("#editProfileModal .keyboard");
const twitterInput = qsr<HTMLInputElement>("#editProfileModal .twitter");
const githubInput = qsr<HTMLInputElement>("#editProfileModal .github");
const websiteInput = qsr<HTMLInputElement>("#editProfileModal .website");
const badgeIdsSelect = qsr("#editProfileModal .badgeSelectionContainer");
const showActivityOnPublicProfileInput = qsr<HTMLInputElement>(
  "#editProfileModal .editProfileShowActivityOnPublicProfile",
);

const inputs = [
  bioInput,
  keyboardInput,
  twitterInput,
  githubInput,
  websiteInput,
];

inputs.forEach((input) => {
  input.on("input", updateSaveButtonState);
});

showActivityOnPublicProfileInput.on("change", updateSaveButtonState);

const indicators = [
  addValidation(
    twitterInput,
    TwitterProfileSchema,
    () => originalState.twitter,
  ),
  addValidation(githubInput, GithubProfileSchema, () => originalState.github),
  addValidation(websiteInput, WebsiteSchema, () => originalState.website),
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
      updateSaveButtonState();
    });

  indicators.forEach((it) => it.hide());
}

let characterCountersInitialized = false;

function initializeCharacterCounters(): void {
  if (characterCountersInitialized) return;
  new CharacterCounter(bioInput, 250);
  new CharacterCounter(keyboardInput, 75);
  characterCountersInitialized = true;
}

type ProfileState = {
  bio: string;
  keyboard: string;
  twitter: string;
  github: string;
  website: string;
  badgeId: number;
  showActivityOnPublicProfile: boolean;
};

function getProfileState(): ProfileState {
  return {
    bio: bioInput.getValue() ?? "",
    keyboard: keyboardInput.getValue() ?? "",
    twitter: twitterInput.getValue() ?? "",
    github: githubInput.getValue() ?? "",
    website: websiteInput.getValue() ?? "",
    badgeId: currentSelectedBadgeId,
    showActivityOnPublicProfile:
      showActivityOnPublicProfileInput.isChecked() ?? false,
  };
}

function buildUpdatesFromState(state: ProfileState): UserProfileDetails {
  return {
    bio: state.bio,
    keyboard: state.keyboard,
    socialProfiles: {
      twitter: state.twitter,
      github: state.github,
      website: state.website,
    },
    showActivityOnPublicProfile: state.showActivityOnPublicProfile,
  };
}

let originalState: ProfileState;

function hasProfileChanged(
  originalProfile: ProfileState,
  currentProfile: ProfileState,
): boolean {
  return (
    originalProfile.bio !== currentProfile.bio ||
    originalProfile.keyboard !== currentProfile.keyboard ||
    originalProfile.twitter !== currentProfile.twitter ||
    originalProfile.github !== currentProfile.github ||
    originalProfile.website !== currentProfile.website ||
    originalProfile.badgeId !== currentProfile.badgeId ||
    originalProfile.showActivityOnPublicProfile !==
      currentProfile.showActivityOnPublicProfile
  );
}

function updateSaveButtonState(): void {
  const currentState = getProfileState();
  const hasChanges = hasProfileChanged(originalState, currentState);

  const hasValidationErrors = [
    { value: currentState.twitter, schema: TwitterProfileSchema },
    { value: currentState.github, schema: GithubProfileSchema },
    { value: currentState.website, schema: WebsiteSchema },
  ].some(
    ({ value, schema }) => value !== "" && !schema.safeParse(value).success,
  );

  saveButton.native.disabled = !hasChanges || hasValidationErrors;
}

async function updateProfile(): Promise<void> {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;

  const currentState = getProfileState();
  const updates = buildUpdatesFromState(currentState);

  showLoaderBar();
  const response = await Ape.users.updateProfile({
    body: {
      ...updates,
      selectedBadgeId: currentSelectedBadgeId,
    },
  });
  hideLoaderBar();

  if (response.status !== 200) {
    showErrorNotification("Failed to update profile", { response });
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

  DB.setSnapshot(snapshot);
  originalState = currentState;
  showSuccessNotification("Profile updated");

  hide();
}

function addValidation(
  element: ElementWithUtils<HTMLInputElement>,
  schema: Zod.Schema,
  getOriginalValue: () => string,
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
    if (value === undefined || value === "" || value === getOriginalValue()) {
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
