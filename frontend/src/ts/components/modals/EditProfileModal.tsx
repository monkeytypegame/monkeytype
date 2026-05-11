import {
  GithubProfileSchema,
  TwitterProfileSchema,
  UserProfileDetailsSchema,
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
import { fromSchema } from "../ui/form/utils";

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
      const updates = {
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
          <label class="text-sub mb-[0.25em] block">name</label>
          <div>
            To update your name, go to Account Settings &gt; Account &gt; Update
            account name
          </div>
        </div>

        <div>
          <label class="text-sub mb-[0.25em] block">avatar</label>
          <div>
            To update your avatar make sure your Discord account is linked, then
            go to Account Settings &gt; Account &gt; Discord Integration and
            click &quot;Update Avatar&quot;
          </div>
        </div>

        <div>
          <label class="text-sub mb-[0.25em] block">bio</label>
          <form.Field
            name="bio"
            validators={{
              onChange: fromSchema(UserProfileDetailsSchema.shape.bio),
            }}
          >
            {(field) => (
              <>
                <TextareaField
                  field={field}
                  maxLength={250}
                  showIndicator={true}
                />
                <div class="mt-1 text-base">
                  {field().state.value.length}/250
                </div>
              </>
            )}
          </form.Field>
        </div>

        <div>
          <label class="text-sub mb-[0.25em] block">keyboard</label>
          <form.Field
            name="keyboard"
            validators={{
              onChange: fromSchema(UserProfileDetailsSchema.shape.keyboard),
            }}
          >
            {(field) => (
              <>
                <TextareaField
                  field={field}
                  maxLength={75}
                  showIndicator={true}
                />
                <div class="mt-1 text-base">
                  {field().state.value.length}/75
                </div>
              </>
            )}
          </form.Field>
        </div>

        <div>
          <label class="text-sub mb-[0.25em] block">github</label>
          <div class="flex items-center">
            <p class="my-2 mr-2">https://github.com/</p>
            <div class="w-full max-w-60">
              <form.Field
                name="github"
                validators={{
                  onChange: fromSchema(GithubProfileSchema),
                }}
              >
                {(field) => (
                  <InputField
                    field={field}
                    class="github"
                    type="text"
                    maxLength={39}
                  />
                )}
              </form.Field>
            </div>
          </div>
        </div>

        <div>
          <label class="text-sub mb-[0.25em] block">twitter</label>
          <div class="flex items-center">
            <p class="my-2 mr-2">https://x.com/</p>
            <div class="w-full max-w-60">
              <form.Field
                name="twitter"
                validators={{
                  onChange: fromSchema(TwitterProfileSchema),
                }}
              >
                {(field) => (
                  <InputField
                    field={field}
                    class="twitter"
                    type="text"
                    maxLength={15}
                  />
                )}
              </form.Field>
            </div>
          </div>
        </div>

        <div>
          <label class="text-sub mb-[0.25em] block">website</label>
          <form.Field
            name="website"
            validators={{
              onChange: fromSchema(WebsiteSchema),
            }}
          >
            {(field) => (
              <InputField
                field={field}
                class="website"
                type="text"
                maxLength={200}
              />
            )}
          </form.Field>
        </div>

        <div>
          <label class="text-sub mb-[0.25em] block">badge</label>
          <form.Field name="badgeId">
            {(field) => (
              <div class="flex flex-wrap">
                <button
                  type="button"
                  class="w-max cursor-pointer mr-2 mb-2 p-0 rounded-half"
                  classList={{
                    "opacity-100": field().state.value === -1,
                    "opacity-25 hover:opacity-100": field().state.value !== -1,
                  }}
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
                      class="w-max cursor-pointer mr-2 mb-2 p-0 rounded-half"
                      classList={{
                        "opacity-100": field().state.value === badge.id,
                        "opacity-25 hover:opacity-100":
                          field().state.value !== badge.id,
                      }}
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
          <label class="text-sub mb-[0.25em] block">public activity</label>
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