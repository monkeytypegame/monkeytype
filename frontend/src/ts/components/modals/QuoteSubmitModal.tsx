import { QuoteTextSchema } from "@monkeytype/contracts/quotes";
import { Language } from "@monkeytype/schemas/languages";
import { createForm } from "@tanstack/solid-form";
import { JSXElement } from "solid-js";

import Ape from "../../ape";
import { Config } from "../../config/store";
import { LanguageGroupNames } from "../../constants/languages";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { hideModalAndClearChain } from "../../states/modals";
import {
  showErrorNotification,
  showNoticeNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { removeLanguageSize } from "../../utils/strings";
import { AnimatedModal } from "../common/AnimatedModal";
import { Captcha } from "../ui/form/Captcha";
import { InputField } from "../ui/form/InputField";
import { LabeledField } from "../ui/form/LabeledField";
import { SubmitButton } from "../ui/form/SubmitButton";
import { TextareaField } from "../ui/form/TextareaField";
import {
  allFieldsMandatory,
  fieldMandatory,
  fromSchema,
} from "../ui/form/utils";
import SlimSelect from "../ui/SlimSelect";

export function QuoteSubmitModal(): JSXElement {
  const languageOptions = LanguageGroupNames.filter(
    (g) => g !== "swiss_german",
  ).map((g) => ({
    value: g,
    text: g.replace(/_/g, " "),
  }));

  const form = createForm(() => ({
    defaultValues: {
      text: "",
      source: "",
      language: removeLanguageSize(Config.language) as string,
      captcha: "",
    },
    onSubmit: async ({ value }) => {
      showLoaderBar();
      const response = await Ape.quotes.add({
        body: {
          text: value.text,
          source: value.source,
          language: value.language as Language,
          captcha: value.captcha,
        },
      });
      hideLoaderBar();

      if (response.status !== 200) {
        showErrorNotification("Failed to submit quote", { response });
        return;
      }

      showSuccessNotification("Quote submitted.");
      hideModalAndClearChain("QuoteSubmit");
    },
    onSubmitInvalid: () => {
      showNoticeNotification("Please fill in all fields");
    },
    validators: {
      onChange: allFieldsMandatory(),
    },
  }));

  const handleAfterShow = (): void => {
    form.update({
      ...form.options,
      defaultValues: {
        text: "",
        source: "",
        language: removeLanguageSize(Config.language) as string,
        captcha: "",
      },
    });
    form.reset();
  };

  return (
    <AnimatedModal
      id="QuoteSubmit"
      mode="dialog"
      title="Submit a quote"
      focusFirstInput={true}
      afterShow={handleAfterShow}
    >
      <form
        class="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <ul class="list-disc pl-4 text-sm text-sub">
          <li>
            Do not include content that contains any libelous or otherwise
            unlawful, abusive or obscene text.
          </li>
          <li>
            Verify quotes added aren{"'"}t duplicates of any already present
          </li>
          <li>
            Please do not add extremely short quotes (less than 60 characters)
          </li>
          <li>
            <b>
              Submitting low quality quotes or misusing this form will cause you
              to lose access to this feature
            </b>
          </li>
        </ul>
        <form.Field
          name="text"
          validators={{ onChange: fromSchema(QuoteTextSchema) }}
          children={(field) => (
            <LabeledField label="quote">
              <div class="relative">
                <TextareaField
                  field={field}
                  class="bg-bg-secondary w-full rounded p-2 text-text"
                  autocomplete="off"
                />
                <div
                  class={`absolute right-2 bottom-2 text-xs ${250 - field().state.value.length < 0 ? "text-error" : "text-sub"}`}
                >
                  {250 - field().state.value.length}
                </div>
              </div>
            </LabeledField>
          )}
        />
        <form.Field
          name="source"
          validators={{ onChange: fieldMandatory<string>() }}
          children={(field) => (
            <LabeledField label="source">
              <InputField
                class="bg-bg-secondary w-full rounded p-2 text-text"
                type="text"
                field={field}
                autocomplete="off"
              />
            </LabeledField>
          )}
        />
        <form.Field
          name="language"
          children={(field) => (
            <LabeledField label="language">
              <SlimSelect
                appendTo="container"
                options={languageOptions}
                selected={field().state.value}
                onChange={(val) => field().handleChange(val ?? "")}
              />
            </LabeledField>
          )}
        />
        <form.Field
          name="captcha"
          children={(field) => <Captcha field={field} />}
        />
        <SubmitButton form={form} text="submit" />
      </form>
    </AnimatedModal>
  );
}
