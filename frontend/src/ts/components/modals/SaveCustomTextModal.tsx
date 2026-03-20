import { createForm } from "@tanstack/solid-form";
import { Accessor, JSXElement } from "solid-js";

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
import { fieldMandatory } from "../ui/form/utils";

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
              const mandatory = fieldMandatory("Name is required")({
                value,
              });
              if (mandatory !== undefined) return mandatory;
              if (value.length > 32) {
                return "Name must be 32 characters or less";
              }
              if (!/^[\w\s-]+$/.test(value)) {
                return "Name can only contain letters, numbers, spaces, underscores and hyphens";
              }
              const isLong = form.getFieldValue("isLong");
              const names = CustomText.getCustomTextNames(isLong);
              if (names.includes(value)) return "Duplicate name";
              return undefined;
            },
          }}
          children={(field) => <InputField field={field} placeholder="name" />}
        />
        <form.Field
          name="isLong"
          children={(field) => (
            <Checkbox field={field} label="Long text (book mode)" />
          )}
        />
        <div class="text-xs text-sub">
          Disables editing this text but allows you to save progress by pressing
          shift + enter or bailing out. You can then load this text again to
          continue where you left off.
        </div>
        <SubmitButton form={form} variant="button" text="save" skipDirtyCheck />
      </form>
    </AnimatedModal>
  );
}
