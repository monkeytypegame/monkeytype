import Config, * as UpdateConfig from "../config";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as TestLogic from "../test/test-logic";
import * as Notifications from "../elements/notifications";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";

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
  const input = $("#customTestDurationModal input").val() as string;
  const duration = parseInput(input);
  let formattedDuration = "";

  if (duration < 0) {
    formattedDuration = "Negative time? Really?";
  } else if (duration === 0) {
    formattedDuration = "Infinite test";
  } else {
    formattedDuration = format(duration);
  }

  $("#customTestDurationModal .preview").text(formattedDuration);
}

export function show(showOptions?: ShowOptions): void {
  void modal.show({
    ...showOptions,
    focusFirstInput: "focusAndSelect",
    beforeAnimation: async (modalEl) => {
      (
        modalEl.querySelector("input") as HTMLInputElement
      ).value = `${Config.time}`;
      previewDuration();
    },
  });
}

function hide(clearChain = false): void {
  void modal.hide({
    clearModalChain: clearChain,
  });
}

function apply(): void {
  const val = parseInput($("#customTestDurationModal input").val() as string);

  if (val !== null && !isNaN(val) && val >= 0 && isFinite(val)) {
    UpdateConfig.setTimeConfig(val);
    ManualRestart.set();
    TestLogic.restart();
    if (val >= 1800) {
      Notifications.add("Stay safe and take breaks!", 0);
    } else if (val === 0) {
      Notifications.add(
        "Infinite time! Make sure to use Bail Out from the command line to save your result.",
        0,
        {
          duration: 7,
        }
      );
    }
  } else {
    Notifications.add("Custom time must be a positive number or zero", 0);
    return;
  }

  hide(true);
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl.addEventListener("submit", (e) => {
    e.preventDefault();
    apply();
  });
  modalEl.querySelector("input")?.addEventListener("input", (e) => {
    previewDuration();
  });
}

const modal = new AnimatedModal({
  dialogId: "customTestDurationModal",
  setup,
});
