import * as UpdateConfig from "../config";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as TestLogic from "../test/test-logic";
import * as Notifications from "../elements/notifications";

export function show(): void {
  if ($("#customWordAmountPopupWrapper").hasClass("hidden")) {
    $("#customWordAmountPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        $("#customWordAmountPopup input").trigger("focus").select();
      });
  }
}

export function hide(): void {
  if (!$("#customWordAmountPopupWrapper").hasClass("hidden")) {
    $("#customWordAmountPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#customWordAmountPopupWrapper").addClass("hidden");
        }
      );
  }
}

function apply(): void {
  const val = parseInt($("#customWordAmountPopup input").val() as string);

  if (val !== null && !isNaN(val) && val >= 0) {
    UpdateConfig.setWordCount(val as MonkeyTypes.WordsModes);
    ManualRestart.set();
    TestLogic.restart();
    if (val > 2000) {
      Notifications.add("Stay safe and take breaks!", 0);
    } else if (val == 0) {
      Notifications.add(
        "Infinite words! Make sure to use Bail Out from the command line to save your result.",
        0,
        7
      );
    }
  } else {
    Notifications.add("Custom word amount must be at least 1", 0);
  }

  hide();
}

$("#customWordAmountPopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "customWordAmountPopupWrapper") {
    hide();
  }
});

$("#customWordAmountPopup input").on("keypress", (e) => {
  if (e.key === "Enter") {
    apply();
  }
});

$("#customWordAmountPopup .button").on("click", () => {
  apply();
});

$(document).on("click", "#top .config .wordCount .text-button", (e) => {
  const wrd = $(e.currentTarget).attr("wordCount");
  if (wrd == "custom") {
    show();
  }
});

$(document).on("keydown", (event) => {
  if (
    event.key === "Escape" &&
    !$("#customWordAmountPopupWrapper").hasClass("hidden")
  ) {
    hide();
    event.preventDefault();
  }
});
