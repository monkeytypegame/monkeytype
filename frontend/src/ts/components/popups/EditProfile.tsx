import {
  GithubProfileSchema,
  TwitterProfileSchema,
  UserProfileDetails,
  WebsiteSchema,
} from "@monkeytype/schemas/users";
import { For } from "solid-js";
import Ape from "../../ape";
import { getHTMLById } from "../../controllers/badge-controller";
import * as DB from "../../db";
import {
  showSuccessNotification,
  showErrorNotification,
} from "../../states/notifications";

import { AnimatedModal } from "../common/AnimatedModal";
import { hideModal } from "../../states/modals";
import { Checkbox } from "../ui/form/Checkbox";
import { InputField } from "../ui/form/InputField";
import { TextareaField } from "../ui/form/TextareaField";
import { createForm } from "@tanstack/solid-form";
import { SubmitButton } from "../ui/form/SubmitButton";

export function EditProfile() {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;

  const badges = snapshot.inventory?.badges ?? [];
  const form = createForm(() => ({
    defaultValues: {
      bio: snapshot.details?.bio ?? "",
      keyboard: snapshot.details?.keyboard ?? "",
      github: snapshot.details?.socialProfiles?.github ?? "",
      twitter: snapshot.details?.socialProfiles?.twitter ?? "",
      website: snapshot.details?.socialProfiles?.website ?? "",
      showActivityOnPublicProfile:
        snapshot.details?.showActivityOnPublicProfile ?? true,
      badgeId: badges.find((b) => b.selected)?.id ?? -1,
    },
    onSubmit: async ({ value }) => {
      const updates: UserProfileDetails = {
        bio: value.bio,
        keyboard: value.keyboard,
        socialProfiles: {
          twitter: value.twitter || undefined,
          github: value.github || undefined,
          website: value.website || undefined,
        },
        showActivityOnPublicProfile: value.showActivityOnPublicProfile,
      };

      const response = await Ape.users.updateProfile({
        body: {
          ...updates,
          selectedBadgeId: value.badgeId,
        },
      });

      if (response.status !== 200) {
        showErrorNotification("Failed to update profile", { response });
        return;
      }

      snapshot.details = response.body.data ?? updates;
      snapshot.inventory?.badges.forEach((badge) => {
        if (badge.id === value.badgeId) {
          badge.selected = true;
        } else {
          delete badge.selected;
        }
      });
      
      form.reset(value);
      hideModal("EditProfile");
      DB.setSnapshot(snapshot);
      showSuccessNotification("Profile updated");
    },
  }));

  return (
    <AnimatedModal
      id="EditProfile"
      title="Edit Profile"
      modalClass="max-w-[600px]"
    >
      <form
        class="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
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
          <form.Field name="bio">
            {(field) => (
              <>
                <TextareaField field={field} />
                <div class="characterCounter">
                  {(field().state.value).length}/250
                </div>
              </>
            )}
          </form.Field>
        </div>

        <div>
          <label>keyboard</label>
          <form.Field name="keyboard">
            {(field) => (
              <>
                <TextareaField field={field} />
                <div class="characterCounter">
                  {(field().state.value).length}/75
                </div>
              </>
            )}
          </form.Field>
        </div>

        <div>
          <label>github</label>
          <div class="socialURL">
            <p>https://github.com/</p>
            <div class="inputAndIndicator">
              <form.Field
                name="github"
                validators={{
                  onChange: ({ value }) => {
                    if (value === "") return undefined;
                    return GithubProfileSchema.safeParse(value).success
                      ? undefined
                      : "Invalid GitHub username";
                  },
                }}
              >
                {(field) => {
                  return (
                    <InputField
                      field={field}
                      class="github"
                      type="text"
                      maxLength={39}
                      showIndicator={true}
                    />
                  );
                }}
              </form.Field>
            </div>
          </div>
        </div>

        <div>
          <label>twitter</label>
          <div class="socialURL">
            <p>https://x.com/</p>
            <div class="inputAndIndicator">
              <form.Field
                name="twitter"
                validators={{
                  onChange: ({ value }) => {
                    if (value === "") return undefined;
                    return TwitterProfileSchema.safeParse(value).success
                      ? undefined
                      : "Invalid Twitter username";
                  },
                }}
              >
                {(field) => {
                  return (
                    <InputField
                      field={field}
                      class="twitter"
                      type="text"
                      maxLength={15}
                      showIndicator={true}
                    />
                  );
                }}
              </form.Field>
            </div>
          </div>
        </div>

        <div>
          <label>website</label>
          <div class="inputAndIndicator">
            <form.Field
              name="website"
              validators={{
                onChange: ({ value }) => {
                  if (value === "") return undefined;

                  return WebsiteSchema.safeParse(value).success
                    ? undefined
                    : "Invalid website URL";
                },
              }}
            >
              {(field) => {
                return (
                  <InputField
                    field={field}
                    class="website"
                    type="text"
                    maxLength={200}
                    showIndicator={true}
                  />
                );
              }}
            </form.Field>
          </div>
        </div>

        <div>
          <label>badge</label>
          <form.Field name="badgeId">
            {(field) => (
              <div class="badgeSelectionContainer">
                <button
                  type="button"
                  class="badgeSelectionItem"
                  classList={{ selected: field().state.value === -1 }}
                  onClick={() => field().handleChange(-1)}
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
                      classList={{ selected: field().state.value === badge.id }}
                      onClick={() => field().handleChange(badge.id)}
                      innerHTML={getHTMLById(badge.id, false, true)}
                    ></button>
                  )}
                </For>
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <label>public activity</label>
          <form.Field name="showActivityOnPublicProfile">
            {(field) => (
              <Checkbox
                field={field}
                label="Include test activity graph on your public profile."
              />
            )}
          </form.Field>
        </div>
        <SubmitButton form={form}>save</SubmitButton>
      </form>
    </AnimatedModal>
  );
}
