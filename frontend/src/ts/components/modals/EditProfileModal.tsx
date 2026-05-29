import {
  GithubProfileSchema,
  TwitterProfileSchema,
  UserProfileDetailsSchema,
  WebsiteSchema,
} from "@monkeytype/schemas/users";
import { createForm } from "@tanstack/solid-form";
import { For } from "solid-js";

import Ape from "../../ape";
import { setSnapshot } from "../../db";
import { invalidateMyProfile } from "../../queries/profile";
import { hideModal } from "../../states/modals";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { getSnapshot } from "../../states/snapshot";
import { cn } from "../../utils/cn";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { UserBadge } from "../common/UserBadge";
import { Checkbox } from "../ui/form/Checkbox";
import { InputField } from "../ui/form/InputField";
import { SubmitButton } from "../ui/form/SubmitButton";
import { TextareaField } from "../ui/form/TextareaField";
import { fromSchema } from "../ui/form/utils";

export function EditProfile() {
  const snapshot = getSnapshot();
  if (snapshot === undefined) {
    throw new Error("missing snapshot in EditProfile");
  }
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

      const newBadges =
        snapshot.inventory?.badges?.map((it) => ({
          ...it,
          selected: it.id === value.badgeId,
        })) ?? [];

      form.reset(value);
      hideModal("EditProfile");
      setSnapshot({
        ...snapshot,
        details: response.body.data ?? updates,
        inventory: { ...snapshot.inventory, badges: newBadges },
      });
      void invalidateMyProfile();
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
          <label class="mb-[0.25em] block text-sub">name</label>
          <div>
            To update your name, go to Account Settings &gt; Account &gt; Update
            account name
          </div>
        </div>

        <div>
          <label class="mb-[0.25em] block text-sub">avatar</label>
          <div>
            To update your avatar make sure your Discord account is linked, then
            go to Account Settings &gt; Account &gt; Discord Integration and
            click &quot;Update Avatar&quot;
          </div>
        </div>

        <div>
          <label class="mb-[0.25em] block text-sub">bio</label>
          <form.Field
            name="bio"
            validators={{
              onChange: fromSchema(UserProfileDetailsSchema.shape.bio),
            }}
          >
            {(field) => (
              <>
                <TextareaField field={field} maxLength={250} />
                <div class="mt-1 text-base">
                  {field().state.value.length}/250
                </div>
              </>
            )}
          </form.Field>
        </div>

        <div>
          <label class="mb-[0.25em] block text-sub">keyboard</label>
          <form.Field
            name="keyboard"
            validators={{
              onChange: fromSchema(UserProfileDetailsSchema.shape.keyboard),
            }}
          >
            {(field) => (
              <>
                <TextareaField field={field} maxLength={75} />
                <div class="mt-1 text-base">
                  {field().state.value.length}/75
                </div>
              </>
            )}
          </form.Field>
        </div>

        <div>
          <label class="mb-[0.25em] block text-sub">github</label>
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
          <label class="mb-[0.25em] block text-sub">twitter</label>
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
          <label class="mb-[0.25em] block text-sub">website</label>
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
          <label class="mb-[0.25em] block text-sub">badge</label>
          <form.Field name="badgeId">
            {(field) => (
              <div class="flex flex-wrap gap-2">
                <For each={[{ id: -1 }, ...badges]}>
                  {(badge) => (
                    <Button
                      class={cn("p-0 opacity-25 hover:opacity-100", {
                        "opacity-100": field().state.value === badge.id,
                      })}
                      active={field().state.value === badge.id}
                      onClick={() => field().handleChange(badge.id)}
                    >
                      <UserBadge
                        id={badge.id}
                        class="p-1.5 text-em-sm"
                        hideDescription
                      />
                    </Button>
                  )}
                </For>
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <label class="mb-[0.25em] block text-sub">public activity</label>
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
