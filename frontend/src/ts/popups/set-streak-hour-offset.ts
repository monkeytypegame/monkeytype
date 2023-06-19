import Ape from "../ape";
// import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as Loader from "../elements/loader";
// import * as Settings from "../pages/settings";
import * as ConnectionState from "../states/connection";
import * as Skeleton from "./skeleton";
import { isPopupVisible } from "../utils/misc";
import { getSnapshot, setSnapshot } from "../db";

const wrapperId = "streakHourOffsetPopupWrapper";

export function show(): void {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }

  Skeleton.append(wrapperId);
  if (!isPopupVisible(wrapperId)) {
    if (getSnapshot()?.streakHourOffset !== undefined) {
      $(`#${wrapperId} .text`).html(
        "You have already set your streak hour offset."
      );
      $(`#${wrapperId} input`).remove();
      $(`#${wrapperId} .preview`).remove();
      $(`#${wrapperId} .button`).remove();
    } else {
      updatePreview();
    }

    $(`#${wrapperId}`)
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {
        $(`#${wrapperId} input`).trigger("focus");
      });
  }
}

function updatePreview(): void {
  const inputValue = $(`#${wrapperId} input`).val() as number;
  const preview = $(`#${wrapperId} .preview`);

  const date = new Date();
  date.setUTCHours(0);
  date.setUTCMinutes(0);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);

  const newDate = new Date();
  newDate.setUTCHours(0);
  newDate.setUTCMinutes(0);
  newDate.setUTCSeconds(0);
  newDate.setUTCMilliseconds(0);

  newDate.setHours(newDate.getHours() - -1 * inputValue); //idk why, but it only works when i subtract (so i have to negate inputValue)

  preview.html(`
  
  Current local reset time: ${date.toLocaleTimeString()}<br>
  New local reset time: ${newDate.toLocaleTimeString()}

  `);
}

function hide(): void {
  if (isPopupVisible(wrapperId)) {
    $(`#${wrapperId}`)
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        125,
        () => {
          $(`#${wrapperId}`).addClass("hidden");
          Skeleton.remove(wrapperId);
        }
      );
  }
}

async function apply(): Promise<void> {
  const value = parseInt($(`#${wrapperId} input`).val() as string);

  if (isNaN(value)) {
    Notifications.add("Streak hour offset must be a number", 0);
    return;
  }

  if (value < -11 || value > 12) {
    Notifications.add("Streak hour offset must be between -11 and 12", 0);
    return;
  }

  Loader.show();

  const response = await Ape.users.setStreakHourOffset(value);
  Loader.hide();
  if (response.status !== 200) {
    Notifications.add(
      "Failed to set streak hour offset: " + response.message,
      -1
    );
  } else {
    Notifications.add("Streak hour offset set", 1);
    const snap = getSnapshot() as MonkeyTypes.Snapshot;
    snap.streakHourOffset = value;
    setSnapshot(snap);
    hide();
  }
}

$(`#${wrapperId}`).on("mousedown", (e) => {
  if ($(e.target).attr("id") === wrapperId) {
    hide();
  }
});

$(`#${wrapperId} .button`).on("click", () => {
  apply();
});

$(`#${wrapperId} input`).on("keypress", (e) => {
  if (e.key === "Enter") {
    apply();
  }
});

$(".pageSettings .section.setStreakHourOffset").on(
  "click",
  "#setStreakHourOffset",
  () => {
    show();
  }
);

$(`#${wrapperId} input`).on("input", () => {
  updatePreview();
});

Skeleton.save(wrapperId);
