import { QuoteReportReason } from "@monkeytype/schemas/quotes";
import { createForm } from "@tanstack/solid-form";
import { JSXElement, createSignal } from "solid-js";

import Ape from "../../ape";
import { Config } from "../../config/store";
import * as CaptchaController from "../../controllers/captcha-controller";
import QuotesController from "../../controllers/quotes-controller";
import { useRef } from "../../hooks/useRef";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { hideModalAndClearChain } from "../../states/modals";
import {
  showNoticeNotification,
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { quoteId } from "../../states/quote-report";
import { removeLanguageSize } from "../../utils/strings";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { Separator } from "../common/Separator";
import { fieldMandatory } from "../ui/form/utils";
import SlimSelect from "../ui/SlimSelect";

export function QuoteReportModal(): JSXElement {
  const [captchaRef, captchaEl] = useRef<HTMLDivElement>();
  const [quoteText, setQuoteText] = createSignal("");
  const [captchaComplete, setCaptchaComplete] = createSignal(false);

  const form = createForm(() => ({
    defaultValues: {
      reason: "Grammatical error" as QuoteReportReason,
      comment: "",
    },
    onSubmit: async ({ value }) => {
      const captchaResponse = CaptchaController.getResponse("quoteReportModal");
      if (!captchaResponse) {
        showNoticeNotification("Please complete the captcha");
        return;
      }

      const id = quoteId().toString();
      const quoteLanguage = removeLanguageSize(Config.language);

      if (id === "" || id === "0") {
        showNoticeNotification("Please select a quote");
        return;
      }

      const characterDifference = value.comment.length - 250;
      if (characterDifference > 0) {
        showNoticeNotification(
          `Report comment is ${characterDifference} character(s) too long`,
        );
        return;
      }

      showLoaderBar();
      const response = await Ape.quotes.report({
        body: {
          quoteId: id,
          quoteLanguage,
          reason: value.reason,
          comment: value.comment,
          captcha: captchaResponse,
        },
      });
      hideLoaderBar();

      if (response.status !== 200) {
        showErrorNotification("Failed to report quote", { response });
        return;
      }

      showSuccessNotification("Report submitted. Thank you!");
      hideModalAndClearChain("QuoteReport");
    },
    onSubmitInvalid: () => {
      showNoticeNotification("Please fill in all fields");
    },
  }));

  const handleBeforeShow = async (): Promise<void> => {
    setCaptchaComplete(false);
    form.update({
      ...form.options,
      defaultValues: {
        reason: "Grammatical error" as QuoteReportReason,
        comment: "",
      },
    });
    form.reset();

    const language =
      Config.language === "swiss_german" ? "german" : Config.language;
    const { quotes } = await QuotesController.getQuotes(language);
    const quote = quotes.find((q) => q.id === quoteId());
    setQuoteText(quote?.text ?? "");
  };

  const handleAfterShow = (): void => {
    const el = captchaEl();
    if (el === undefined) return;
    CaptchaController.render(el, "quoteReportModal", () => {
      setCaptchaComplete(true);
    });
  };

  const handleAfterHide = (): void => {
    CaptchaController.reset("quoteReportModal");
  };

  return (
    <AnimatedModal
      modalClass="w-full max-w-[750px]"
      id="QuoteReport"
      mode="dialog"
      title="Report a quote"
      beforeShow={handleBeforeShow}
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
        Please report quotes responsibly - misuse may result in you losing
        access to this feature.
        <br />
        <span class="text-error">Please add comments in English only.</span>
        <Separator />
        <div class="grid gap-1">
          <label class="text-sub">quote</label>
          <div class="text-xl text-text" dir="auto">
            {quoteText()}
          </div>
        </div>
        <form.Field
          name="reason"
          children={(field) => (
            <div class="grid gap-1">
              <label class="text-sub">reason</label>
              <SlimSelect
                options={[
                  { value: "Grammatical error", text: "Grammatical error" },
                  { value: "Duplicate quote", text: "Duplicate quote" },
                  {
                    value: "Inappropriate content",
                    text: "Inappropriate content",
                  },
                  {
                    value: "Low quality content",
                    text: "Low quality content",
                  },
                  { value: "Incorrect source", text: "Incorrect source" },
                ]}
                selected={field().state.value}
                onChange={(val) =>
                  field().handleChange(
                    (val ?? "Grammatical error") as QuoteReportReason,
                  )
                }
                settings={{ showSearch: false }}
              />
            </div>
          )}
        />
        <form.Field
          name="comment"
          validators={{ onChange: fieldMandatory<string>() }}
          children={(field) => (
            <div class="grid gap-1">
              <label class="text-sub">comment</label>
              <div class="relative">
                <textarea
                  class="bg-bg-secondary min-h-50 w-full rounded p-2 text-text"
                  value={field().state.value}
                  onInput={(e) => field().handleChange(e.currentTarget.value)}
                  onBlur={() => field().handleBlur()}
                  autocomplete="off"
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
        <div ref={captchaRef}></div>
        <Button type="submit" text="report" disabled={!captchaComplete()} />
      </form>
    </AnimatedModal>
  );
}
