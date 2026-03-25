import { createForm } from "@tanstack/solid-form";
import { JSXElement } from "solid-js";

import { setConfig } from "../../config/setters";
import { getConfig } from "../../config/store";
import { restartTestEvent } from "../../events/test";
import { hideModalAndClearChain } from "../../states/modals";
import { showNoticeNotification } from "../../states/notifications";
import { AnimatedModal } from "../common/AnimatedModal";
import { InputField } from "../ui/form/InputField";
import { SubmitButton } from "../ui/form/SubmitButton";

export function CustomWordAmountModal(): JSXElement {
  const form = createForm(() => ({
    defaultValues: {
      words: getConfig.words.toString(),
    },
    onSubmit: ({ value }) => {
      const val = parseInt(value.words, 10);

      setConfig("words", val);
      restartTestEvent.dispatch();

      if (val > 2000) {
        showNoticeNotification("Stay safe and take breaks!");
      } else if (val === 0) {
        showNoticeNotification(
          "Infinite words! Make sure to use Bail Out from the command line to save your result.",
          { durationMs: 7000 },
        );
      }

      hideModalAndClearChain("CustomWordAmount");
    },
  }));

  return (
    <AnimatedModal
      id="CustomWordAmount"
      title="Custom word amount"
      focusFirstInput="focusAndSelect"
      beforeShow={() => {
        form.reset({ words: getConfig.words.toString() });
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
          name="words"
          validators={{
            onChange: ({ value }) => {
              const val = parseInt(value, 10);
              if (isNaN(val) || !isFinite(val)) return "Must be a number";
              if (val < 0) return "Must be non-negative";
              return undefined;
            },
          }}
          children={(field) => (
            <InputField field={field} type="number" placeholder="word amount" />
          )}
        />
        <div class="text-xs">
          You can start an infinite test by inputting 0. Then, to stop the test,
          use the Bail Out feature:
          <br />(<kbd>esc</kbd> or <kbd>ctrl/cmd</kbd> + <kbd>shift</kbd> +{" "}
          <kbd>p</kbd> &gt; Bail Out)
        </div>
        <SubmitButton
          form={form}
          variant="button"
          text="apply"
          skipDirtyCheck
        />
      </form>
    </AnimatedModal>
  );
}
