import { Accessor, createSignal, JSXElement, Show } from "solid-js";

import * as CustomTextState from "../../legacy-states/custom-text-name";
import { hideModal } from "../../states/modals";
import {
  showNoticeNotification,
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import * as CustomText from "../../test/custom-text";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";

export function SaveCustomTextModal(props: {
  textToSave: Accessor<string[]>;
}): JSXElement {
  const [name, setName] = createSignal("");
  const [isLong, setIsLong] = createSignal(false);
  const [error, setError] = createSignal("");

  const validate = (value: string): string => {
    if (value.length === 0) return "Name is required";
    if (value.length > 32) return "Name must be 32 characters or less";
    if (!/^[\w\s-]+$/.test(value)) {
      return "Name can only contain letters, numbers, spaces, underscores and hyphens";
    }
    const names = CustomText.getCustomTextNames(isLong());
    if (names.includes(value)) return "Duplicate name";
    return "";
  };

  const handleInput = (value: string) => {
    setName(value);
    setError(validate(value));
  };

  const save = () => {
    const err = validate(name());
    if (err) {
      setError(err);
      return;
    }

    const text = props.textToSave();
    if (text.length === 0) {
      showNoticeNotification("Custom text can't be empty");
      return;
    }

    const saved = CustomText.setCustomText(name(), text, isLong());
    if (saved) {
      CustomTextState.setCustomTextName(name(), isLong());
      showSuccessNotification("Custom text saved");
      hideModal("SaveCustomText");
    } else {
      showErrorNotification("Error saving custom text");
    }
  };

  return (
    <AnimatedModal
      id="SaveCustomText"
      title="Save custom text"
      modalClass="max-w-sm"
      focusFirstInput={true}
      beforeShow={() => {
        setName("");
        setIsLong(false);
        setError("");
      }}
    >
      <form
        class="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <input
          type="text"
          placeholder="name"
          value={name()}
          onInput={(e) => handleInput(e.currentTarget.value)}
        />
        <Show when={error()}>
          <div class="text-xs text-error">{error()}</div>
        </Show>
        <label class="flex items-start gap-2">
          <input
            type="checkbox"
            checked={isLong()}
            onChange={(e) => {
              setIsLong(e.currentTarget.checked);
              setError(validate(name()));
            }}
            class="mt-1"
          />
          <div>
            <div>Long text (book mode)</div>
            <div class="text-xs text-sub">
              Disables editing this text but allows you to save progress by
              pressing shift + enter or bailing out. You can then load this text
              again to continue where you left off.
            </div>
          </div>
        </label>
        <Button
          variant="button"
          text="save"
          type="submit"
          disabled={error() !== "" || name() === ""}
        />
      </form>
    </AnimatedModal>
  );
}
