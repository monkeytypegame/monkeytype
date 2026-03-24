import { Language } from "@monkeytype/schemas/languages";
import { createForm } from "@tanstack/solid-form";
import { JSXElement } from "solid-js";

import Ape from "../../ape";
import { Config } from "../../config/store";
import { LanguageGroupNames } from "../../constants/languages";
import * as CaptchaController from "../../controllers/captcha-controller";
import { useRef } from "../../hooks/useRef";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { hideModalAndClearChain } from "../../states/modals";
import {
  showNoticeNotification,
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { removeLanguageSize } from "../../utils/strings";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { InputField } from "../ui/form/InputField";
import { fieldMandatory } from "../ui/form/utils";
import SlimSelect from "../ui/SlimSelect";

export function QuoteSubmitModal(): JSXElement {
  const [captchaRef, captchaEl] = useRef<HTMLDivElement>();

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
    },
    onSubmit: async ({ value }) => {
      const captcha = CaptchaController.getResponse("submitQuote");

      showLoaderBar();
      const response = await Ape.quotes.add({
        body: {
          text: value.text,
          source: value.source,
          language: value.language as Language,
          captcha,
        },
      });
      hideLoaderBar();

      if (response.status !== 200) {
        showErrorNotification("Failed to submit quote", { response });
        return;
      }

      showSuccessNotification("Quote submitted.");
      CaptchaController.reset("submitQuote");
      hideModalAndClearChain("QuoteSubmit");
    },
    onSubmitInvalid: () => {
      showNoticeNotification("Please fill in all fields");
    },
  }));

  const handleAfterShow = (): void => {
    const el = captchaEl();
    if (el === undefined) return;
    CaptchaController.render(el, "submitQuote");
    form.update({
      ...form.options,
      defaultValues: {
        text: "",
        source: "",
        language: removeLanguageSize(Config.language) as string,
      },
    });
    form.reset();
  };

  const handleAfterHide = (): void => {
    CaptchaController.reset("submitQuote");
  };

  return (
    <AnimatedModal
      id="QuoteSubmit"
      mode="dialog"
      title="Submit a quote"
      focusFirstInput={true}
      afterShow={handleAfterShow}
      afterHide={handleAfterHide}
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
          validators={{ onChange: fieldMandatory<string>() }}
          children={(field) => (
            <div class="grid gap-1">
              <label class="text-xs text-sub">quote</label>
              <div class="relative">
                <textarea
                  class="bg-bg-secondary w-full rounded p-2 text-text"
                  value={field().state.value}
                  onInput={(e) => field().handleChange(e.currentTarget.value)}
                  onBlur={() => field().handleBlur()}
                  autocomplete="off"
                  dir="auto"
                ></textarea>
                <div
                  class={`absolute right-2 bottom-2 text-xs ${250 - field().state.value.length < 0 ? "text-error" : "text-sub"}`}
                >
                  {250 - field().state.value.length}
                </div>
              </div>
            </div>
          )}
        />
        <form.Field
          name="source"
          validators={{ onChange: fieldMandatory<string>() }}
          children={(field) => (
            <div class="grid gap-1">
              <label class="text-xs text-sub">source</label>
              <InputField
                class="bg-bg-secondary w-full rounded p-2 text-text"
                type="text"
                field={field}
                autocomplete="off"
              />
            </div>
          )}
        />
        <form.Field
          name="language"
          children={(field) => (
            <div class="grid gap-1">
              <label class="text-xs text-sub">language</label>
              <SlimSelect
                options={languageOptions}
                selected={field().state.value}
                onChange={(val) => field().handleChange(val ?? "")}
              />
            </div>
          )}
        />
        <div ref={captchaRef}></div>
        <Button type="submit" text="submit" />
      </form>
    </AnimatedModal>
  );
}
