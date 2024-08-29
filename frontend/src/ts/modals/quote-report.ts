import Ape from "../ape";
import Config from "../config";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import QuotesController from "../controllers/quotes-controller";
import * as CaptchaController from "../controllers/captcha-controller";
import { removeLanguageSize } from "../utils/strings";
// @ts-expect-error TODO: update slim-select
import SlimSelect from "slim-select";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import { CharacterCounter } from "../elements/character-counter";
import { QuoteReportReason } from "@monkeytype/contracts/schemas/quotes";

type State = {
  quoteToReport?: MonkeyTypes.Quote;
  reasonSelect?: SlimSelect | undefined;
};

const state: State = {
  quoteToReport: undefined,
  reasonSelect: undefined,
};

export async function show(
  quoteId: number,
  showOptions?: ShowOptions
): Promise<void> {
  void modal.show({
    mode: "dialog",
    ...showOptions,
    beforeAnimation: async () => {
      CaptchaController.render(
        document.querySelector("#quoteReportModal .g-recaptcha") as HTMLElement,
        "quoteReportModal"
      );

      const language =
        Config.language === "swiss_german" ? "german" : Config.language;

      const { quotes } = await QuotesController.getQuotes(language);
      state.quoteToReport = quotes.find((quote) => {
        return quote.id === quoteId;
      });

      $("#quoteReportModal .quote").text(state.quoteToReport?.text as string);
      $("#quoteReportModal .reason").val("Grammatical error");
      $("#quoteReportModal .comment").val("");

      state.reasonSelect = new SlimSelect({
        select: "#quoteReportModal .reason",
        settings: {
          showSearch: false,
        },
      });

      new CharacterCounter($("#quoteReportModal .comment"), 250);
    },
  });
}

async function hide(clearChain = false): Promise<void> {
  void modal.hide({
    clearModalChain: clearChain,
    afterAnimation: async () => {
      CaptchaController.reset("quoteReportModal");
      state.reasonSelect?.destroy();
      state.reasonSelect = undefined;
    },
  });
}

async function submitReport(): Promise<void> {
  const captchaResponse = CaptchaController.getResponse("quoteReportModal");
  if (!captchaResponse) {
    Notifications.add("Please complete the captcha");
    return;
  }

  const quoteId = state.quoteToReport?.id.toString();
  const quoteLanguage = removeLanguageSize(Config.language);
  const reason = $("#quoteReportModal .reason").val() as QuoteReportReason;
  const comment = $("#quoteReportModal .comment").val() as string;
  const captcha = captchaResponse;

  if (quoteId === undefined || quoteId === "") {
    Notifications.add("Please select a quote");
    return;
  }

  if (!reason) {
    Notifications.add("Please select a valid report reason");
    return;
  }

  if (!comment) {
    Notifications.add("Please provide a comment");
    return;
  }

  const characterDifference = comment.length - 250;
  if (characterDifference > 0) {
    Notifications.add(
      `Report comment is ${characterDifference} character(s) too long`
    );
    return;
  }

  Loader.show();
  const response = await Ape.quotes.report({
    body: {
      quoteId,
      quoteLanguage,
      reason,
      comment,
      captcha,
    },
  });
  Loader.hide();

  if (response.status !== 200) {
    Notifications.add("Failed to report quote: " + response.body.message, -1);
    return;
  }

  Notifications.add("Report submitted. Thank you!", 1);
  void hide(true);
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl.querySelector("button")?.addEventListener("click", async () => {
    await submitReport();
  });
}

const modal = new AnimatedModal({
  dialogId: "quoteReportModal",
  setup,
});
