import * as UpdateConfig from "./config";
import * as ManualRestart from "./manual-restart-tracker";
import * as Notifications from "./notification-center";
import * as TestLogic from "./test-logic";

export function show(mode) {
  if ($("#customMode2PopupWrapper").hasClass("hidden")) {
    if (mode == "time") {
      $("#customMode2Popup .title").text("Test length");
      $("#customMode2Popup").attr("mode", "time");
    } else if (mode == "words") {
      $("#customMode2Popup .title").text("Word amount");
      $("#customMode2Popup").attr("mode", "words");
    }
    $("#customMode2PopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, (e) => {
        $("#customMode2Popup input").focus().select();
      });
  }
}

function hide() {
  if (!$("#customMode2PopupWrapper").hasClass("hidden")) {
    $("#customMode2PopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#customMode2PopupWrapper").addClass("hidden");
        }
      );
  }
}

function apply() {
  let mode = $("#customMode2Popup").attr("mode");
  let val = parseInt($("#customMode2Popup input").val());

  if (mode == "time") {
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
  } else if (mode == "words") {
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
  }

  hide();
}

$("#customMode2PopupWrapper").click((e) => {
  if ($(e.target).attr("id") === "customMode2PopupWrapper") {
    hide();
  }
});

$("#customMode2Popup input").keypress((e) => {
  if (e.keyCode == 13) {
    apply();
  }
});

$("#customMode2Popup .button").click(() => {
  apply();
});
