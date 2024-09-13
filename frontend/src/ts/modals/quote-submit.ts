import Ape from "../ape";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import * as CaptchaController from "../controllers/captcha-controller";
import * as Strings from "../utils/strings";
import * as JSONData from "../utils/json-data";
import Config from "../config";
import SlimSelect from "slim-select";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import { CharacterCounter } from "../elements/character-counter";

let dropdownReady = false;
async function initDropdown(): Promise<void> {
  if (dropdownReady) return;
  const languageGroups = await JSONData.getLanguageGroups();
  for (const group of languageGroups) {
    if (group.name === "swiss_german") continue;
    $("#quoteSubmitModal .newQuoteLanguage").append(
      `<option value="${group.name}">${group.name.replace(/_/g, " ")}</option>`
    );
  }
  dropdownReady = true;
}

let select: SlimSelect | undefined = undefined;

async function submitQuote(): Promise<void> {
  const text = $("#quoteSubmitModal .newQuoteText").val() as string;
  const source = $("#quoteSubmitModal .newQuoteSource").val() as string;
  const language = $("#quoteSubmitModal .newQuoteLanguage").val() as string;
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
    afterAnimation: async () => {
      CaptchaController.reset("submitQuote");
      select?.destroy();
      select = undefined;
    },
  });
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl.querySelector("button")?.addEventListener("click", () => {
    void submitQuote();
    hide(true);
  });
}

const modal = new AnimatedModal({
  dialogId: "quoteSubmitModal",
  setup,
});
