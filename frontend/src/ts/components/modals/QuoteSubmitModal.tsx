import { Language } from "@monkeytype/schemas/languages";
import { JSXElement, createSignal } from "solid-js";

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
import SlimSelect from "../ui/SlimSelect";

export function QuoteSubmitModal(): JSXElement {
  const [captchaRef, captchaEl] = useRef<HTMLDivElement>();
  const [text, setText] = createSignal("");
  const [source, setSource] = createSignal("");
  const [language, setLanguage] = createSignal<string>(
    removeLanguageSize(Config.language),
  );

  const charsRemaining = (): number => 250 - text().length;

  const languageOptions = LanguageGroupNames.filter(
    (g) => g !== "swiss_german",
  ).map((g) => ({
    value: g,
    text: g.replace(/_/g, " "),
  }));

  const handleAfterShow = (): void => {
    const el = captchaEl();
    if (el === undefined) return;
    CaptchaController.render(el, "submitQuote");
    setLanguage(removeLanguageSize(Config.language));
    setSource("");
  };

  const handleAfterHide = (): void => {
    CaptchaController.reset("submitQuote");
  };

  const submit = async (): Promise<void> => {
    const captcha = CaptchaController.getResponse("submitQuote");
    const quoteText = text();
    const quoteSource = source();
    const quoteLang = language() as Language;

    if (!quoteText || !quoteSource || !quoteLang) {
      showNoticeNotification("Please fill in all fields");
      return;
    }

    showLoaderBar();
    const response = await Ape.quotes.add({
      body: {
        text: quoteText,
        source: quoteSource,
        language: quoteLang,
        captcha,
      },
    });
    hideLoaderBar();

    if (response.status !== 200) {
      showErrorNotification("Failed to submit quote", { response });
      return;
    }

    showSuccessNotification("Quote submitted.");
    setText("");
    setSource("");
    CaptchaController.reset("submitQuote");
    hideModalAndClearChain("QuoteSubmit");
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
      <label class="text-xs text-sub">quote</label>
      <div class="relative">
        <textarea
          class="bg-bg-secondary w-full rounded p-2 text-text"
          value={text()}
          onInput={(e) => setText(e.currentTarget.value)}
          autocomplete="off"
          dir="auto"
        ></textarea>
        <div
          class={`absolute right-2 bottom-2 text-xs ${charsRemaining() < 0 ? "text-error" : "text-sub"}`}
        >
          {charsRemaining()}
        </div>
      </div>
      <label class="text-xs text-sub">source</label>
      <input
        class="bg-bg-secondary w-full rounded p-2 text-text"
        type="text"
        value={source()}
        onInput={(e) => setSource(e.currentTarget.value)}
        autocomplete="off"
      />
      <label class="text-xs text-sub">language</label>
      <SlimSelect
        options={languageOptions}
        selected={language()}
        onChange={(val) => setLanguage(val ?? "")}
      />
      <div ref={captchaRef}></div>
      <Button text="submit" onClick={() => void submit()} />
    </AnimatedModal>
  );
}
