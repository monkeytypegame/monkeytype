import Ape from "../ape";
import Config from "../config";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import QuotesController from "../controllers/quotes-controller";
import * as CaptchaController from "../controllers/captcha-controller";
import { removeLanguageSize } from "../utils/strings";
import SlimSelect from "slim-select";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import { CharacterCounter } from "../elements/character-counter";

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

      new CharacterCounter(
        $("#quoteReportModal .comment") as JQuery<HTMLTextAreaElement>,
        250
      );
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
    return Notifications.add("Please complete the captcha");
  }

  const quoteId = state.quoteToReport?.id.toString();
  const quoteLanguage = removeLanguageSize(Config.language);
  const reason = $("#quoteReportModal .reason").val() as string;
  const comment = $("#quoteReportModal .comment").val() as string;
  const captcha = captchaResponse as string;

  if (quoteId === undefined || quoteId === "") {
    return Notifications.add("Please select a quote");
  }

  if (!reason) {
    return Notifications.add("Please select a valid report reason");
  }

  if (!comment) {
    return Notifications.add("Please provide a comment");
  }

  const characterDifference = comment.length - 250;
  if (characterDifference > 0) {
    return Notifications.add(
      `Report comment is ${characterDifference} character(s) too long`
    );
  }

  Loader.show();
  const response = await Ape.quotes.report(
    quoteId,
    quoteLanguage,
    reason,
    comment,
    captcha
  );
  Loader.hide();

  if (response.status !== 200) {
    return Notifications.add("Failed to report quote: " + response.message, -1);
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
