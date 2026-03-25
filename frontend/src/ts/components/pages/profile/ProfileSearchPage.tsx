import { UserNameSchema } from "@monkeytype/schemas/users";
import { createForm } from "@tanstack/solid-form";
import { createEffect, createSignal, JSXElement, Show } from "solid-js";

import { navigationEvent } from "../../../events/navigation";
import { useRefWithUtils } from "../../../hooks/useRefWithUtils";
import { queryClient } from "../../../queries";
import { getUserProfile } from "../../../queries/profile";
import { getActivePage } from "../../../states/core";
import { showNoticeNotification } from "../../../states/notifications";
import { H2 } from "../../common/Headers";
import { InputField } from "../../ui/form/InputField";
import { SubmitButton } from "../../ui/form/SubmitButton";
import { fromSchema } from "../../ui/form/utils";

export function ProfileSearchPage(): JSXElement {
  const [isEditable, setEditable] = createSignal(true);
  const isOpen = () => getActivePage() === "profileSearch";

  // Refs are assigned by SolidJS via the ref attribute
  const [inputRef, inputEl] = useRefWithUtils<HTMLElement>();

  const form = createForm(() => ({
    defaultValues: {
      username: "",
    },
    onSubmit: async ({ value }) => {
      setEditable(false);
      try {
        navigationEvent.dispatch({
          url: `/profile/${value.username}`,
          options: {},
        });
      } finally {
        setEditable(true);
      }
    },
    onSubmitInvalid: () => {
      showNoticeNotification("Please fill in all fields");
    },
  }));

  createEffect(() => {
    if (isOpen()) {
      form.reset();
      requestAnimationFrame(() => {
        inputEl()?.qs("input")?.focus({ preventScroll: true });
      });
    }
  });

  return (
    <Show when={isOpen()}>
      <div class="grid min-h-full place-items-center">
        <form
          class="inline-grid w-96 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <div class="text-center">
            <H2 class="text-2xl" text="Profile lookup" />
          </div>

          <div class="flex w-full gap-2 text-xl">
            <div class="flex-1 text-center" ref={inputRef}>
              <form.Field
                name="username"
                validators={{
                  onChange: fromSchema(UserNameSchema),
                  onChangeAsyncDebounceMs: 1000,
                  onChangeAsync: async (field) => {
                    try {
                      const result = await queryClient.fetchQuery(
                        getUserProfile(field.value),
                      );
                      return result !== null ? undefined : "Unknown user";
                    } catch (e) {
                      return "Unknown user";
                    }
                  },
                }}
                children={(field) => (
                  <InputField
                    field={field}
                    showIndicator
                    autocomplete="new-username"
                    disabled={!isEditable()}
                  />
                )}
              />
            </div>
            <div class="text-center">
              <SubmitButton
                form={form}
                class="shrink"
                fa={{ icon: "fa-chevron-right" }}
                disabled={!isEditable()}
              />
            </div>
          </div>
        </form>
      </div>
    </Show>
  );
}
