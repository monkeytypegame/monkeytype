import * as UpdateConfig from "./config";
import * as ManualRestart from "./manual-restart-tracker";
import * as Notifications from "./notifications";
import * as TestLogic from "./test-logic";

export function show() {
  if ($("#customWordAmountPopupWrapper").hasClass("hidden")) {
    $("#customWordAmountPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, (e) => {
        $("#customWordAmountPopup input").focus().select();
      });
  }
}

export function hide() {
  if (!$("#customWordAmountPopupWrapper").hasClass("hidden")) {
    $("#customWordAmountPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#customWordAmountPopupWrapper").addClass("hidden");
        }
      );
  }
}

function apply() {
  let val = parseInt($("#customWordAmountPopup input").val());

  if (val !== null && !isNaN(val) && val >= 0) {
    UpdateConfig.setWordCount(val);
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

$("#customWordAmountPopupWrapper").click((e) => {
  if ($(e.target).attr("id") === "customWordAmountPopupWrapper") {
    hide();
  }
});

$("#customWordAmountPopup input").keypress((e) => {
  if (e.keyCode == 13) {
    apply();
  }
});

$("#customWordAmountPopup .button").click(() => {
  apply();
});
