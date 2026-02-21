import { ElementWithUtils, qsr } from "../utils/dom";
import Ape from "../ape";
import Config from "../config";

import { showLoaderBar, hideLoaderBar } from "../signals/loader-bar";
import * as Notifications from "../elements/notifications";
import QuotesController, { Quote } from "../controllers/quotes-controller";
import * as CaptchaController from "../controllers/captcha-controller";
import { removeLanguageSize } from "../utils/strings";
import SlimSelect from "slim-select";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import { CharacterCounter } from "../elements/character-counter";
import { QuoteReportReason } from "@monkeytype/schemas/quotes";

type State = {
  quoteToReport?: Quote;
  reasonSelect?: SlimSelect | undefined;
};

const state: State = {
  quoteToReport: undefined,
  reasonSelect: undefined,
};

export async function show(
  quoteId: number,
  showOptions?: ShowOptions,
): Promise<void> {
  if (!CaptchaController.isCaptchaAvailable()) {
    Notifications.add(
      "Could not show quote report popup: Captcha is not available. This could happen due to a blocked or failed network request. Please refresh the page or contact support if this issue persists.",
      -1,
    );
    return;
  }

  void modal.show({
    mode: "dialog",
    ...showOptions,
    beforeAnimation: async (modalEl) => {
      CaptchaController.render(
        modalEl.qsr(".g-recaptcha").native,
        "quoteReportModal",
      );

      const language =
        Config.language === "swiss_german" ? "german" : Config.language;

      const { quotes } = await QuotesController.getQuotes(language);
      state.quoteToReport = quotes.find((quote) => {
        return quote.id === quoteId;
      });

      modalEl.qsr(".quote").setText(state.quoteToReport?.text as string);
      modalEl.qsr<HTMLSelectElement>(".reason").setValue("Grammatical error");
      modalEl.qsr<HTMLTextAreaElement>(".comment").setValue("");

      state.reasonSelect = new SlimSelect({
        select: "#quoteReportModal .reason",
        settings: {
          showSearch: false,
        },
      });

      new CharacterCounter(modalEl.qsr(".comment"), 250);
    },
  });
}

async function hide(clearChain = false): Promise<void> {
  void modal.hide({
    clearModalChain: clearChain,
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
  const reason = qsr<HTMLSelectElement>(
    "#quoteReportModal select.reason",
  ).getValue() as QuoteReportReason;
  const comment = qsr<HTMLTextAreaElement>(
    "#quoteReportModal .comment",
  ).getValue() as string;
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
      `Report comment is ${characterDifference} character(s) too long`,
    );
    return;
  }

  showLoaderBar();
  const response = await Ape.quotes.report({
    body: {
      quoteId,
      quoteLanguage,
      reason,
      comment,
      captcha,
    },
  });
  hideLoaderBar();

  if (response.status !== 200) {
    Notifications.add("Failed to report quote", -1, { response });
    return;
  }

  Notifications.add("Report submitted. Thank you!", 1);
  void hide(true);
}

async function setup(modalEl: ElementWithUtils): Promise<void> {
  modalEl.qs("button")?.on("click", async () => {
    await submitReport();
  });
}

async function cleanup(): Promise<void> {
  CaptchaController.reset("quoteReportModal");
  state.reasonSelect?.destroy();
  state.reasonSelect = undefined;
}

const modal = new AnimatedModal({
  dialogId: "quoteReportModal",
  setup,
  cleanup,
});
