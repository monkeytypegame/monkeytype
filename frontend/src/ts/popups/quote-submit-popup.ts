import Ape from "../ape";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import * as CaptchaController from "../controllers/captcha-controller";
import * as Misc from "../utils/misc";
import Config from "../config";
import * as Skeleton from "./skeleton";

const wrapperId = "quoteSubmitPopupWrapper";

let dropdownReady = false;
async function initDropdown(): Promise<void> {
  if (dropdownReady) return;
  const languages = await Misc.getLanguageList();
  languages.forEach((language) => {
    if (
      language === "english_commonly_misspelled" ||
      language === "hungarian_2.5k"
    ) {
      return;
    }
    if (!/_\d*k$/g.test(language)) {
      $("#quoteSubmitPopup #submitQuoteLanguage").append(
        `<option value="${language}">${language.replace(/_/g, " ")}</option>`
      );
    }
  });
  $("#quoteSubmitPopup #submitQuoteLanguage").select2();
  dropdownReady = true;
}

async function submitQuote(): Promise<void> {
  const text = $("#quoteSubmitPopup #submitQuoteText").val() as string;
  const source = $("#quoteSubmitPopup #submitQuoteSource").val() as string;
  const language = $("#quoteSubmitPopup #submitQuoteLanguage").val() as string;
  const captcha = CaptchaController.getResponse("submitQuote");

  if (!text || !source || !language) {
    return Notifications.add("Please fill in all fields", 0);
  }

  Loader.show();
  const response = await Ape.quotes.submit(text, source, language, captcha);
  Loader.hide();

  if (response.status !== 200) {
    return Notifications.add("Failed to submit quote: " + response.message, -1);
  }

  Notifications.add("Quote submitted.", 1);
  $("#quoteSubmitPopup #submitQuoteText").val("");
  $("#quoteSubmitPopup #submitQuoteSource").val("");
  $("#quoteSubmitPopup .characterCount").removeClass("red");
  $("#quoteSubmitPopup .characterCount").text("-");
  CaptchaController.reset("submitQuote");
}

export async function show(noAnim = false): Promise<void> {
  const isSubmissionEnabled = (await Ape.quotes.isSubmissionEnabled()).data
    .isEnabled;
  if (!isSubmissionEnabled) {
    Notifications.add(
      "Quote submission is disabled temporarily due to a large submission queue.",
      0,
      {
        duration: 5,
      }
    );
    return;
  }
  Skeleton.append(wrapperId);

  if (!Misc.isPopupVisible(wrapperId)) {
    CaptchaController.render(
      document.querySelector("#quoteSubmitPopup .g-recaptcha") as HTMLElement,
      "submitQuote"
    );
    await initDropdown();
    $("#quoteSubmitPopup #submitQuoteLanguage").val(
      Config.language.replace(/_\d*k$/g, "")
    );
    $("#quoteSubmitPopup #submitQuoteLanguage").trigger("change");
    $("#quoteSubmitPopup input").val("");
    $("#quoteSubmitPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, noAnim ? 0 : 125, () => {
        $("#quoteSubmitPopup textarea").trigger("focus").select();
      });
  }
}

export function hide(): void {
  if (Misc.isPopupVisible(wrapperId)) {
    $("#quoteSubmitPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        125,
        () => {
          $("#quoteSubmitPopupWrapper").addClass("hidden");
          CaptchaController.reset("submitQuote");
          Skeleton.remove(wrapperId);
        }
      );
  }
}

$("#quoteSubmitPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "quoteSubmitPopupWrapper") {
    hide();
  }
});

$("#popups").on("click", "#quoteSubmitPopup #submitQuoteButton", () => {
  submitQuote();
});

$("#quoteSubmitPopupWrapper textarea").on("input", () => {
  setTimeout(() => {
    const len = ($("#quoteSubmitPopup textarea").val() as string)?.length;
    $("#quoteSubmitPopup .characterCount").text(len);
    if (len < 60) {
      $("#quoteSubmitPopup .characterCount").addClass("red");
    } else {
      $("#quoteSubmitPopup .characterCount").removeClass("red");
    }
  }, 1);
});

$("#quoteSubmitPopupWrapper input").on("keydown", (e) => {
  if (e.key === "Enter") {
    submitQuote();
  }
});

Skeleton.save(wrapperId);
