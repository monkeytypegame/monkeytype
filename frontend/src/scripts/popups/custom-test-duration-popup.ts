import * as UpdateConfig from "../config";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as TestLogic from "../test/test-logic";
import * as Notifications from "../elements/notifications";

function parseInput(input: string): number {
  const re = /((-\s*)?\d+(\.\d+)?\s*[hms]?)/g;
  const seconds = [...input.toLowerCase().matchAll(re)]
    .map((match) => {
      const part = match[0];
      const duration = parseFloat(part.replace(/\s+/g, ""));

      if (part.includes("h")) {
        return 3600 * duration;
      } else if (part.includes("m")) {
        return 60 * duration;
      } else {
        return duration;
      }
    })
    .reduce((total, dur) => total + dur, 0);

  return Math.floor(seconds);
}

function format(duration: number): string {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = (duration % 3600) % 60;

  const time = [];

  if (hours > 0) {
    time.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  }

  if (minutes > 0) {
    time.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  }

  if (seconds > 0) {
    time.push(`${seconds} second${seconds === 1 ? "" : "s"}`);
  }

  if (time.length === 3) {
    return `${time[0]}, ${time[1]} and ${time[2]}`;
  } else if (time.length === 2) {
    return `${time[0]} and ${time[1]}`;
  } else {
    return `${time[0]}`;
  }
}

function previewDuration(): void {
  const input = $("#customTestDurationPopup input").val() as string;
  const duration = parseInput(input);
  let formattedDuration = "";

  if (duration < 0) {
    formattedDuration = "NEGATIVE TIME";
  } else if (duration == 0) {
    formattedDuration = "Infinite test";
  } else {
    formattedDuration = "Total time: " + format(duration);
  }

  $("#customTestDurationPopup .preview").text(formattedDuration);
}

export function show(): void {
  if ($("#customTestDurationPopupWrapper").hasClass("hidden")) {
    $("#customTestDurationPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        $("#customTestDurationPopup input").trigger("focus").select();
      });
  }

  previewDuration();
}

export function hide(): void {
  if (!$("#customTestDurationPopupWrapper").hasClass("hidden")) {
    $("#customTestDurationPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#customTestDurationPopupWrapper").addClass("hidden");
        }
      );
  }
}

function apply(): void {
  const val = parseInput($("#customTestDurationPopup input").val() as string);

  if (val !== null && !isNaN(val) && val >= 0) {
    UpdateConfig.setTimeConfig(val as MonkeyTypes.TimeModes);
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

$("#customTestDurationPopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "customTestDurationPopupWrapper") {
    hide();
  }
});

$("#customTestDurationPopup input").keyup((e) => {
  previewDuration();

  if (e.key === "Enter") {
    apply();
  }
});

$("#customTestDurationPopup .button").on("click", () => {
  apply();
});

$(document).on("click", "#top .config .time .text-button", (e) => {
  const mode = $(e.currentTarget).attr("timeConfig");
  if (mode == "custom") {
    show();
  }
});

$(document).on("keydown", (event) => {
  if (
    event.key === "Escape" &&
    !$("#customTestDurationPopupWrapper").hasClass("hidden")
  ) {
    hide();
    event.preventDefault();
  }
});
