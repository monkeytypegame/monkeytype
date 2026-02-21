import { ElementWithUtils } from "../utils/dom";
import Ape from "../ape";

import { showLoaderBar, hideLoaderBar } from "../signals/loader-bar";
import * as Notifications from "../elements/notifications";
import * as CaptchaController from "../controllers/captcha-controller";
import * as Strings from "../utils/strings";
import Config from "../config";
import SlimSelect from "slim-select";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import { CharacterCounter } from "../elements/character-counter";
import { Language } from "@monkeytype/schemas/languages";
import { LanguageGroupNames } from "../constants/languages";

let dropdownReady = false;
async function initDropdown(): Promise<void> {
  if (dropdownReady) return;

  for (const group of LanguageGroupNames) {
    if (group === "swiss_german") continue;
    modal
      .getModal()
      .qsr(".newQuoteLanguage")
      .appendHtml(
        `<option value="${group}">${group.replace(/_/g, " ")}</option>`,
      );
  }
  dropdownReady = true;
}

let select: SlimSelect | undefined = undefined;

async function submitQuote(): Promise<void> {
  const modalEl = modal.getModal();
  const text = modalEl
    .qsr<HTMLTextAreaElement>(".newQuoteText")
    .getValue() as string;
  const source = modalEl
    .qsr<HTMLInputElement>(".newQuoteSource")
    .getValue() as string;
  const language = modalEl
    .qsr<HTMLSelectElement>("select.newQuoteLanguage")
    .getValue() as Language;
  const captcha = CaptchaController.getResponse("submitQuote");

  if (!text || !source || !language) {
    Notifications.add("Please fill in all fields", 0);
    return;
  }

  showLoaderBar();
  const response = await Ape.quotes.add({
    body: { text, source, language, captcha },
  });
  hideLoaderBar();

  if (response.status !== 200) {
    Notifications.add("Failed to submit quote", -1, { response });
    return;
  }

  Notifications.add("Quote submitted.", 1);
  modalEl.qsr<HTMLTextAreaElement>(".newQuoteText").setValue("");
  modalEl.qsr<HTMLInputElement>(".newQuoteSource").setValue("");
  CaptchaController.reset("submitQuote");
}

export async function show(showOptions: ShowOptions): Promise<void> {
  if (!CaptchaController.isCaptchaAvailable()) {
    Notifications.add(
      "Could not show quote submit popup: Captcha is not available. This could happen due to a blocked or failed network request. Please refresh the page or contact support if this issue persists.",
      -1,
    );
    return;
  }

  void modal.show({
    ...showOptions,
    mode: "dialog",
    focusFirstInput: true,
    afterAnimation: async (modalEl) => {
      CaptchaController.render(
        modalEl.qsr(".g-recaptcha").native,
        "submitQuote",
      );
      await initDropdown();

      select = new SlimSelect({
        select: "#quoteSubmitModal .newQuoteLanguage",
      });

      modalEl
        .qsr<HTMLSelectElement>("select.newQuoteLanguage")
        .setValue(Strings.removeLanguageSize(Config.language));
      modalEl
        .qsr<HTMLSelectElement>("select.newQuoteLanguage")
        .dispatch("change");
      modalEl.qsr<HTMLInputElement>("input").setValue("");

      new CharacterCounter(modalEl.qsr(".newQuoteText"), 250);
    },
  });
}

function hide(clearModalChain: boolean): void {
  void modal.hide({
    clearModalChain,
  });
}

async function setup(modalEl: ElementWithUtils): Promise<void> {
  modalEl.qs("button")?.on("click", () => {
    void submitQuote();
    hide(true);
  });
}

async function cleanup(): Promise<void> {
  CaptchaController.reset("submitQuote");
  select?.destroy();
  select = undefined;
}

const modal = new AnimatedModal({
  dialogId: "quoteSubmitModal",
  setup,
  cleanup,
});
