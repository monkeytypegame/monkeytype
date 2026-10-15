import { UserNameWithoutFilterSchema } from "@monkeytype/schemas/users";
import { createForm } from "@tanstack/solid-form";
import { createSignal, JSXElement, onCleanup, onMount } from "solid-js";

import { navigationEvent } from "../../../events/navigation";
import { queryClient } from "../../../queries";
import { getUserProfile } from "../../../queries/profile";
import { showNoticeNotification } from "../../../states/notifications";
import { H2 } from "../../common/Headers";
import { InputField } from "../../ui/form/InputField";
import { SubmitButton } from "../../ui/form/SubmitButton";
import { fromSchema } from "../../ui/form/utils";

export function ProfileSearchPage(): JSXElement {
  const [isEditable, setEditable] = createSignal(true);

  let inputRef: HTMLInputElement | undefined;

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

  onMount(() => {
    // the page wrapper is attached and shown after mount, wait a frame
    const frame = requestAnimationFrame(() => {
      inputRef?.focus({ preventScroll: true });
    });
    onCleanup(() => cancelAnimationFrame(frame));
  });

  return (
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
          <div class="flex-1 text-center">
            <form.Field
              name="username"
              validators={{
                onChange: fromSchema(UserNameWithoutFilterSchema),
                onChangeAsyncDebounceMs: 1000,
                onChangeAsync: async (field) => {
                  try {
                    const result = await queryClient.fetchQuery(
                      getUserProfile(field.value),
                    );
                    return result !== null ? undefined : "Unknown user";
                  } catch {
                    return "Unknown user";
                  }
                },
              }}
              children={(field) => (
                <InputField
                  field={field}
                  placeholder="username"
                  autocomplete="new-username"
                  disabled={!isEditable()}
                  ref={(el) => (inputRef = el)}
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
  );
}
