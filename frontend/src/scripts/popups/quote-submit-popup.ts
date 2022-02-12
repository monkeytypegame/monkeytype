// @ts-ignore
import * as Loader from "../elements/loader";
// @ts-ignore
import Config from "../config";
import * as Notifications from "../elements/notifications";
import * as Misc from "../misc";
import axiosInstance from "../axios-instance";
import { AxiosError } from "axios";

let dropdownReady = false;
async function initDropdown(): Promise<void> {
  if (dropdownReady) return;
  const languages = await Misc.getLanguageList();
  languages.forEach((language) => {
    if (
      language === "english_commonly_misspelled" ||
      language === "hungarian_2.5k"
    )
      return;
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
  const data = {
    text: $("#quoteSubmitPopup #submitQuoteText").val(),
    source: $("#quoteSubmitPopup #submitQuoteSource").val(),
    language: $("#quoteSubmitPopup #submitQuoteLanguage").val(),
    captcha: $("#quoteSubmitPopup #g-recaptcha-response").val(),
  };

  if (!data.text || !data.source || !data.language) {
    Notifications.add("Please fill in all fields", 0);
    return;
  }

  Loader.show();
  let response;
  try {
    response = await axiosInstance.post("/quotes", data);
  } catch (error) {
    const e = error as AxiosError;
    Loader.hide();
    const msg = e?.response?.data?.message ?? e.message;
    Notifications.add("Failed to submit quote: " + msg, -1);
    return;
  }
  Loader.hide();
  if (response.status !== 200) {
    Notifications.add(response.data.message);
  } else {
    Notifications.add("Quote submitted.", 1);
    $("#quoteSubmitPopup #submitQuoteText").val("");
    $("#quoteSubmitPopup #submitQuoteSource").val("");
    $("#quoteSubmitPopup .characterCount").removeClass("red");
    $("#quoteSubmitPopup .characterCount").text("-");
    grecaptcha.reset();
  }
}

export async function show(noAnim = false): Promise<void> {
  Notifications.add(
    "Quote submission is disabled temporarily due to a large submission queue.",
    0,
    5
  );
  return;
  // eslint-disable-next-line no-unreachable
  if ($("#quoteSubmitPopupWrapper").hasClass("hidden")) {
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
      .animate({ opacity: 1 }, noAnim ? 0 : 100, () => {
        $("#quoteSubmitPopup textarea").focus().select();
      });
  }
}

export function hide(): void {
  if (!$("#quoteSubmitPopupWrapper").hasClass("hidden")) {
    $("#quoteSubmitPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#quoteSubmitPopupWrapper").addClass("hidden");
        }
      );
  }
}

$("#quoteSubmitPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "quoteSubmitPopupWrapper") {
    hide();
  }
});

$(document).on("click", "#quoteSubmitPopup #submitQuoteButton", () => {
  submitQuote();
});

$("#quoteSubmitPopup textarea").on("input", () => {
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

$("#quoteSubmitPopup input").on("keydown", (e) => {
  if (e.keyCode === 13) {
    submitQuote();
  }
});
