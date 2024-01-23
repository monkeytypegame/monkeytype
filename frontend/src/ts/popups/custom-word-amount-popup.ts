import * as UpdateConfig from "../config";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as TestLogic from "../test/test-logic";
import * as Notifications from "../elements/notifications";
import * as Skeleton from "./skeleton";
import { isPopupVisible } from "../utils/misc";

const wrapperId = "customWordAmountPopupWrapper";

export function show(): void {
  Skeleton.append(wrapperId);
  if (!isPopupVisible(wrapperId)) {
    $("#customWordAmountPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {
        $("#customWordAmountPopup input").trigger("focus").trigger("select");
      });
  }
}

function hide(): void {
  if (isPopupVisible(wrapperId)) {
    $("#customWordAmountPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        125,
        () => {
          $("#customWordAmountPopupWrapper").addClass("hidden");
          Skeleton.remove(wrapperId);
        }
      );
  }
}

function apply(): void {
  const val = parseInt($("#customWordAmountPopup input").val() as string);

  if (val !== null && !isNaN(val) && val >= 0 && isFinite(val)) {
    if (UpdateConfig.setWordCount(val as MonkeyTypes.WordsModes)) {
      ManualRestart.set();
      TestLogic.restart();
      if (val > 2000) {
        Notifications.add("Stay safe and take breaks!", 0);
      } else if (val === 0) {
        Notifications.add(
          "Infinite words! Make sure to use Bail Out from the command line to save your result.",
          0,
          {
            duration: 7,
          }
        );
      }
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

$("#customWordAmountPopupWrapper input").on("keypress", (e) => {
  if (e.key === "Enter") {
    apply();
  }
});

$("#customWordAmountPopupWrapper button").on("click", () => {
  apply();
});

$("#testConfig").on("click", ".wordCount .textButton", (e) => {
  const wrd = $(e.currentTarget).attr("wordCount");
  if (wrd === "custom") {
    show();
  }
});

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && isPopupVisible(wrapperId)) {
    hide();
    event.preventDefault();
  }
});

Skeleton.save(wrapperId);
