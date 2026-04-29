import {
  GithubProfileSchema,
  TwitterProfileSchema,
  UserProfileDetails,
  WebsiteSchema,
} from "@monkeytype/schemas/users";
import { createSignal, For, Show } from "solid-js";
import { ZodSchema } from "zod";

import Ape from "../../ape";
import { getHTMLById } from "../../controllers/badge-controller";
import * as DB from "../../db";
import {
  showSuccessNotification,
  showErrorNotification,
} from "../../states/notifications";

export function EditProfile(props: { onClose: () => void }) {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;

  const badges = snapshot.inventory?.badges ?? [];
  const originalState = {
    bio: snapshot.details?.bio ?? "",
    keyboard: snapshot.details?.keyboard ?? "",
    github: snapshot.details?.socialProfiles?.github ?? "",
    twitter: snapshot.details?.socialProfiles?.twitter ?? "",
    website: snapshot.details?.socialProfiles?.website ?? "",
    showActivityOnPublicProfile:
      snapshot.details?.showActivityOnPublicProfile ?? true,
    badgeId: badges.find((b) => b.selected)?.id ?? -1,
  };

  const [bio, setBio] = createSignal(originalState.bio);
  const [keyboard, setKeyboard] = createSignal(originalState.keyboard);
  const [github, setGithub] = createSignal(originalState.github);
  const [twitter, setTwitter] = createSignal(originalState.twitter);
  const [website, setWebsite] = createSignal(originalState.website);
  const [showActivity, setShowActivity] = createSignal(
    originalState.showActivityOnPublicProfile,
  );
  const [selectedBadgeId, setSelectedBadgeId] = createSignal(
    originalState.badgeId,
  );

  const hasChanges = () =>
    bio() !== originalState.bio ||
    keyboard() !== originalState.keyboard ||
    github() !== originalState.github ||
    twitter() !== originalState.twitter ||
    website() !== originalState.website ||
    selectedBadgeId() !== originalState.badgeId ||
    showActivity() !== originalState.showActivityOnPublicProfile;

  const isValid = (value: string, schema: ZodSchema): boolean =>
    schema.safeParse(value).success;

  const twitterValid = () => isValid(twitter(), TwitterProfileSchema);
  const githubValid = () => isValid(github(), GithubProfileSchema);
  const websiteValid = () => isValid(website(), WebsiteSchema);

  const isSaveDisabled = () =>
    !hasChanges() ||
    (twitter() !== "" && !twitterValid()) ||
    (github() !== "" && !githubValid()) ||
    (website() !== "" && !websiteValid());

  const Indicator = (props: {
    valid: boolean;
    initial: string;
    value: string;
  }) => (
    <Show when={isNotDefault(props.value, props.initial)}>
      <div class="statusIndicator">
        <Show when={props.valid}>
          <div class="indicator level1">
            <i class="fas fa-fw fa-check"></i>
          </div>
        </Show>
        <Show when={!props.valid}>
          <div class="indicator level-1">
            <i class="fas fa-fw fa-times"></i>
          </div>
        </Show>
      </div>
    </Show>
  );

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    const updates: UserProfileDetails = {
      bio: bio(),
      keyboard: keyboard(),
      socialProfiles: {
        twitter: twitter() || undefined,
        github: github() || undefined,
        website: website() || undefined,
      },
      showActivityOnPublicProfile: showActivity(),
    };

    const response = await Ape.users.updateProfile({
      body: {
        ...updates,
        selectedBadgeId: selectedBadgeId(),
      },
    });

    if (response.status !== 200) {
      showErrorNotification("Failed to update profile", { response });
      return;
    }

    snapshot.details = response.body.data ?? updates;
    snapshot.inventory?.badges.forEach((badge) => {
      if (badge.id === selectedBadgeId()) {
        badge.selected = true;
      } else {
        delete badge.selected;
      }
    });

    DB.setSnapshot(snapshot);
    showSuccessNotification("Profile updated");
    props.onClose();
  };

  const isNotDefault = (value: string, initial: string) =>
    value !== initial && value !== "";

  return (
    <dialog
      id="editProfileModal"
      class="modalWrapper"
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <form class="modal" onSubmit={handleSubmit}>
        <div class="title">Edit Profile</div>
        <div>
          <label>name</label>
          <div>
            To update your name, go to Account Settings &gt; Account &gt; Update
            account name
          </div>
        </div>
        <div>
          <label>avatar</label>
          <div>
            To update your avatar make sure your Discord account is linked, then
            go to Account Settings &gt; Account &gt; Discord Integration and
            click &quot;Update Avatar&quot;{" "}
          </div>
        </div>
        <div>
          <label>bio</label>
          <textarea
            class="bio"
            autocomplete="off"
            maxLength="250"
            value={bio()}
            onInput={(e) => setBio(e.currentTarget.value)}
          ></textarea>
          <div class="characterCounter">{bio().length}/250</div>
        </div>
        <div>
          <label>keyboard</label>
          <textarea
            class="keyboard"
            autocomplete="off"
            maxLength="75"
            value={keyboard()}
            onInput={(e) => setKeyboard(e.currentTarget.value)}
          ></textarea>
          <div class="characterCounter">{keyboard().length}/75</div>
        </div>
        <div>
          <label>github</label>
          <div class="socialURL">
            <p>https://github.com/</p>
            <div class="inputAndIndicator">
              <input
                class="github"
                type="text"
                placeholder="username"
                maxLength="39"
                value={github()}
                onInput={(e) => setGithub(e.currentTarget.value)}
                style={{
                  "padding-right": isNotDefault(github(), originalState.github)
                    ? "2.1em"
                    : "0.5em",
                }}
              />
              <Indicator
                value={github()}
                valid={githubValid()}
                initial={originalState.github}
              />
            </div>
          </div>
        </div>
        <div>
          <label>twitter</label>
          <div class="socialURL">
            <p>https://x.com/</p>
            <div class="inputAndIndicator">
              <input
                class="twitter"
                type="text"
                placeholder="username"
                maxLength="15"
                value={twitter()}
                onInput={(e) => setTwitter(e.currentTarget.value)}
                style={{
                  "padding-right": isNotDefault(
                    twitter(),
                    originalState.twitter,
                  )
                    ? "2.1em"
                    : "0.5em",
                }}
              />
              <Indicator
                value={twitter()}
                valid={twitterValid()}
                initial={originalState.twitter}
              />
            </div>
          </div>
        </div>
        <div>
          <label>website</label>
          <div class="inputAndIndicator">
            <input
              class="website"
              type="text"
              maxLength="200"
              value={website()}
              onInput={(e) => setWebsite(e.currentTarget.value)}
              style={{
                "padding-right": isNotDefault(website(), originalState.website)
                  ? "2.1em"
                  : "0.5em",
              }}
            />
            <Indicator
              value={website()}
              valid={websiteValid()}
              initial={originalState.website}
            />
          </div>
        </div>
        <div>
          <label>badge</label>
          <div class="badgeSelectionContainer">
            <button
              type="button"
              class="badgeSelectionItem"
              classList={{ selected: selectedBadgeId() === -1 }}
              onClick={() => setSelectedBadgeId(-1)}
            >
              <div class="badge">
                <i class="fas fa-frown-open"></i>
                <div class="text">none</div>
              </div>
            </button>
            <For each={badges}>
              {(badge) => (
                <button
                  type="button"
                  class="badgeSelectionItem"
                  classList={{ selected: selectedBadgeId() === badge.id }}
                  onClick={() => setSelectedBadgeId(badge.id)}
                  innerHTML={getHTMLById(badge.id, false, true)}
                ></button>
              )}
            </For>
          </div>
        </div>
        <div>
          <label>public activity</label>
          <label class="checkbox">
            <input
              class="editProfileShowActivityOnPublicProfile"
              type="checkbox"
              checked={showActivity()}
              onChange={(e) => setShowActivity(e.currentTarget.checked)}
            />
            <span>Include test activity graph on your public profile.</span>
          </label>
        </div>
        <button
          class="edit-profile-submit"
          type="submit"
          disabled={isSaveDisabled()}
        >
          save
        </button>
      </form>
    </dialog>
  );
}
