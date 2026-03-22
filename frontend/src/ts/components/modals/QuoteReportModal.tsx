import { QuoteReportReason } from "@monkeytype/schemas/quotes";
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
import SlimSelect from "../ui/SlimSelect";

export function QuoteReportModal(): JSXElement {
  const [captchaRef, captchaEl] = useRef<HTMLDivElement>();
  const [quoteText, setQuoteText] = createSignal("");
  const [reason, setReason] =
    createSignal<QuoteReportReason>("Grammatical error");
  const [comment, setComment] = createSignal("");
  const [captchaComplete, setCaptchaComplete] = createSignal(false);

  const charsRemaining = (): number => 250 - comment().length;
  const canSubmit = (): boolean =>
    comment().length > 0 && comment().length <= 250 && captchaComplete();

  const handleBeforeShow = async (): Promise<void> => {
    setComment("");
    setReason("Grammatical error");
    setCaptchaComplete(false);

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

  const submit = async (): Promise<void> => {
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

    if (!reason()) {
      showNoticeNotification("Please select a valid report reason");
      return;
    }

    if (!comment()) {
      showNoticeNotification("Please provide a comment");
      return;
    }

    const characterDifference = comment().length - 250;
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
        reason: reason(),
        comment: comment(),
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
      Please report quotes responsibly - misuse may result in you losing access
      to this feature.
      <br />
      <span class="text-error">Please add comments in English only.</span>
      <Separator />
      <div class="grid gap-1">
        <label class="text-sub">quote</label>
        <div class="text-xl text-text" dir="auto">
          {quoteText()}
        </div>
      </div>
      <div class="grid gap-1">
        <label class="text-sub">reason</label>
        <SlimSelect
          options={[
            { value: "Grammatical error", text: "Grammatical error" },
            { value: "Duplicate quote", text: "Duplicate quote" },
            { value: "Inappropriate content", text: "Inappropriate content" },
            { value: "Low quality content", text: "Low quality content" },
            { value: "Incorrect source", text: "Incorrect source" },
          ]}
          selected={reason()}
          onChange={(val) =>
            setReason((val ?? "Grammatical error") as QuoteReportReason)
          }
          settings={{ showSearch: false }}
        />
      </div>
      <div class="grid gap-1">
        <label class="text-sub">comment</label>
        <div class="relative">
          <textarea
            class="bg-bg-secondary min-h-50 w-full rounded p-2 text-text"
            value={comment()}
            onInput={(e) => setComment(e.currentTarget.value)}
            autocomplete="off"
          ></textarea>
          <div
            class={`absolute right-2 bottom-2 text-xs ${charsRemaining() < 0 ? "text-error" : "text-sub"}`}
          >
            {charsRemaining()}
          </div>
        </div>
      </div>
      <div ref={captchaRef}></div>
      <Button
        text="report"
        disabled={!canSubmit()}
        onClick={() => void submit()}
      />
    </AnimatedModal>
  );
}
