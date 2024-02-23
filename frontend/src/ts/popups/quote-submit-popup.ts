import Ape from "../ape";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import * as CaptchaController from "../controllers/captcha-controller";
import * as Misc from "../utils/misc";
import Config from "../config";
import * as Skeleton from "./skeleton";
import SlimSelect from "slim-select";

const wrapperId = "quoteSubmitPopupWrapper";

let dropdownReady = false;
async function initDropdown(): Promise<void> {
  if (dropdownReady) return;
  const languageGroups = await Misc.getLanguageGroups();
  for (const group of languageGroups) {
    if (group.name === "swiss_german") continue;
    $("#quoteSubmitPopup #submitQuoteLanguage").append(
      `<option value="${group.name}">${group.name.replace(/_/g, " ")}</option>`
    );
  }
  dropdownReady = true;
}

let select: SlimSelect | undefined = undefined;

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
  Skeleton.append(wrapperId);

  if (!Misc.isPopupVisible(wrapperId)) {
    CaptchaController.render(
      document.querySelector("#quoteSubmitPopup .g-recaptcha") as HTMLElement,
      "submitQuote"
    );
    await initDropdown();

    select = new SlimSelect({
      select: "#quoteSubmitPopup #submitQuoteLanguage",
    });

    $("#quoteSubmitPopup #submitQuoteLanguage").val(
      Misc.removeLanguageSize(Config.language)
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

function hide(): void {
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
          select?.destroy();
          select = undefined;
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
  void submitQuote();
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
    void submitQuote();
  }
});

Skeleton.save(wrapperId);
