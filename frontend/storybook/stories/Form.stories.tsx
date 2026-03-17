import preview from "#.storybook/preview";
import { createForm } from "@tanstack/solid-form";
import { createSignal } from "solid-js";
import { z } from "zod";

import { Checkbox } from "../../src/ts/components/ui/form/Checkbox";
import { InputField } from "../../src/ts/components/ui/form/InputField";
import { SubmitButton } from "../../src/ts/components/ui/form/SubmitButton";
import {
  fieldMandatory,
  fromSchema,
} from "../../src/ts/components/ui/form/utils";
import { showNoticeNotification } from "../../src/ts/states/notifications";
import { sleep } from "../../src/ts/utils/misc";

const meta = preview.meta({
  title: "UI/Form",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
});

export const withValidation = meta.story({
  render: () => {
    const form = createForm(() => ({
      defaultValues: {
        username: "",
        password: "",
        rememberMe: true,
      },
      onSubmit: async () => {
        setEditable(false);
        await sleep(1000);
        setEditable(true);
      },
      onSubmitInvalid: () => {
        showNoticeNotification("Please fill in all fields");
      },
    }));

    const [isEditable, setEditable] = createSignal(true);

    return (
      <form
        class="grid w-full gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="username"
          validators={{
            onChange: fromSchema(z.string().min(3).max(5)),
            onChangeAsyncDebounceMs: 250,
            onChangeAsync: async ({ value }) => {
              await sleep(500);
              return value === "kevin" ? undefined : "you must be kevin";
            },
          }}
          children={(field) => (
            <InputField
              field={field}
              showIndicator
              autocomplete="current-user"
              disabled={!isEditable()}
            />
          )}
        />
        <form.Field
          name="password"
          validators={{
            onChange: fieldMandatory(),
          }}
          children={(field) => (
            <InputField
              field={field}
              type="password"
              showIndicator
              autocomplete="current-password"
              disabled={!isEditable()}
            />
          )}
        />
        <form.Field
          name="rememberMe"
          children={(field) => (
            <Checkbox
              field={field}
              disabled={!isEditable()}
              label="remember me"
            />
          )}
        />

        <SubmitButton
          form={form}
          fa={{ icon: "fa-sign-in-alt" }}
          text="sign in"
          disabled={!isEditable()}
        />
      </form>
    );
  },
});
