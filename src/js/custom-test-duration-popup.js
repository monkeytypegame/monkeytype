import * as UpdateConfig from "./config";
import * as ManualRestart from "./manual-restart-tracker";
import * as Notifications from "./notification-center";
import * as TestLogic from "./test-logic";

export function show() {
  if ($("#customTestDurationPopupWrapper").hasClass("hidden")) {
    $("#customTestDurationPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, (e) => {
        $("#customTestDurationPopup input").focus().select();
      });
  }
}

function hide() {
  if (!$("#customTestDurationPopupWrapper").hasClass("hidden")) {
    $("#customTestDurationPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#customTestDurationPopupWrapper").addClass("hidden");
        }
      );
  }
}

function apply() {
  let val = parseInt($("#customTestDurationPopup input").val());

  if (val !== null && !isNaN(val) && val >= 0) {
    UpdateConfig.setTimeConfig(val);
    ManualRestart.set();
    TestLogic.restart();
    if (val >= 1800) {
      Notifications.add("Stay safe and take breaks!", 0);
    } else if (val == 0) {
      Notifications.add(
        "Infinite time! Make sure to use Bail Out from the command line to save your result.",
        0,
        7
      );
    }
  } else {
    Notifications.add("Custom time must be at least 1", 0);
  }

  hide();
}

$("#customTestDurationPopupWrapper").click((e) => {
  if ($(e.target).attr("id") === "customTestDurationPopupWrapper") {
    hide();
  }
});

$("#customTestDurationPopup input").keypress((e) => {
  if (e.keyCode == 13) {
    apply();
  }
});

$("#customTestDurationPopup .button").click(() => {
  apply();
});
