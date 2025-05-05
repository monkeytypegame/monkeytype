import Ape from "../ape";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import * as CaptchaController from "../controllers/captcha-controller";
import * as Strings from "../utils/strings";
import Config from "../config";
import SlimSelect from "slim-select";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import { CharacterCounter } from "../elements/character-counter";
import { Language } from "@monkeytype/contracts/schemas/languages";
import { LanguageGroupNames } from "../constants/languages";

let dropdownReady = false;
async function initDropdown(): Promise<void> {
  if (dropdownReady) return;

  for (const group of LanguageGroupNames) {
    if (group === "swiss_german") continue;
    $("#quoteSubmitModal .newQuoteLanguage").append(
      `<option value="${group}">${group.replace(/_/g, " ")}</option>`
    );
  }
  dropdownReady = true;
}

let select: SlimSelect | undefined = undefined;

async function submitQuote(): Promise<void> {
  const text = $("#quoteSubmitModal .newQuoteText").val() as string;
  const source = $("#quoteSubmitModal .newQuoteSource").val() as string;
  const language = $("#quoteSubmitModal .newQuoteLanguage").val() as Language;
  const captcha = CaptchaController.getResponse("submitQuote");

  if (!text || !source || !language) {
    Notifications.add("Please fill in all fields", 0);
    return;
  }

  Loader.show();
  const response = await Ape.quotes.add({
    body: { text, source, language, captcha },
  });
  Loader.hide();

  if (response.status !== 200) {
    Notifications.add("Failed to submit quote: " + response.body.message, -1);
    return;
  }

  Notifications.add("Quote submitted.", 1);
  $("#quoteSubmitModal .newQuoteText").val("");
  $("#quoteSubmitModal .newQuoteSource").val("");
  CaptchaController.reset("submitQuote");
}

export async function show(showOptions: ShowOptions): Promise<void> {
  if (!CaptchaController.isCaptchaAvailable()) {
    Notifications.add(
      "Could not show quote submit popup: Captcha is not available. This could happen due to a blocked or failed network request. Please refresh the page or contact support if this issue persists.",
      -1
    );
    return;
  }

  void modal.show({
    ...showOptions,
    mode: "dialog",
    focusFirstInput: true,
    afterAnimation: async () => {
      CaptchaController.render(
        document.querySelector("#quoteSubmitModal .g-recaptcha") as HTMLElement,
        "submitQuote"
      );
      await initDropdown();

      select = new SlimSelect({
        select: "#quoteSubmitModal .newQuoteLanguage",
      });

      $("#quoteSubmitModal .newQuoteLanguage").val(
        Strings.removeLanguageSize(Config.language)
      );
      $("#quoteSubmitModal .newQuoteLanguage").trigger("change");
      $("#quoteSubmitModal input").val("");

      new CharacterCounter($("#quoteSubmitModal .newQuoteText"), 250);
    },
  });
}

function hide(clearModalChain: boolean): void {
  void modal.hide({
    clearModalChain,
  });
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl.querySelector("button")?.addEventListener("click", () => {
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
