import { createForm } from "@tanstack/solid-form";
import { Accessor, JSXElement } from "solid-js";
import { z } from "zod";

import * as CustomTextState from "../../legacy-states/custom-text-name";
import { hideModal } from "../../states/modals";
import {
  showNoticeNotification,
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import * as CustomText from "../../test/custom-text";
import { AnimatedModal } from "../common/AnimatedModal";
import { Checkbox } from "../ui/form/Checkbox";
import { InputField } from "../ui/form/InputField";
import { SubmitButton } from "../ui/form/SubmitButton";
import { fromSchema } from "../ui/form/utils";

const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(32, "Name must be 32 characters or less")
  .regex(
    /^[\w\s-]+$/,
    "Name can only contain letters, numbers, spaces, underscores and hyphens",
  );

export function SaveCustomTextModal(props: {
  textToSave: Accessor<string[]>;
}): JSXElement {
  const form = createForm(() => ({
    defaultValues: {
      name: "",
      isLong: false,
    },
    onSubmit: ({ value }) => {
      const text = props.textToSave();
      if (text.length === 0) {
        showNoticeNotification("Custom text can't be empty");
        return;
      }

      const saved = CustomText.setCustomText(value.name, text, value.isLong);
      if (saved) {
        CustomTextState.setCustomTextName(value.name, value.isLong);
        showSuccessNotification("Custom text saved");
        hideModal("SaveCustomText");
      } else {
        showErrorNotification("Error saving custom text");
      }
    },
  }));

  return (
    <AnimatedModal
      id="SaveCustomText"
      title="Save custom text"
      modalClass="max-w-sm"
      focusFirstInput={true}
      beforeShow={() => {
        form.reset();
      }}
    >
      <form
        class="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => {
              const schemaErrors = fromSchema(nameSchema)({ value });
              if (schemaErrors !== undefined) {
                return schemaErrors;
              }

              const isLong = form.getFieldValue("isLong");
              if (CustomText.getCustomTextNames(isLong).includes(value)) {
                return "Duplicate name";
              }

              return undefined;
            },
          }}
          children={(field) => <InputField field={field} placeholder="name" />}
        />
        <form.Field
          name="isLong"
          listeners={{
            onChange: () => {
              void form.validateField("name", "change");
            },
          }}
          children={(field) => (
            <Checkbox field={field} label="Long text (book mode)" />
          )}
        />
        <div class="text-xs text-sub">
          Disables editing this text but allows you to save progress by pressing
          shift + enter or bailing out. You can then load this text again to
          continue where you left off.
        </div>
        <SubmitButton form={form} variant="button" text="save" />
      </form>
    </AnimatedModal>
  );
}
