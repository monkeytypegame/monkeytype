import { isPopupVisible } from "../utils/misc";
import * as Skeleton from "./skeleton";

const wrapperId = "newResultFilterPresetPopupWrapper";

// the function to call after name is inputed by user
let callbackFunc: ((name: string) => void) | null = null;

export function show(): void {
  Skeleton.append(wrapperId);

  if (!isPopupVisible(wrapperId)) {
    $("#newResultFilterPresetPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {
        $("#newResultFilterPresetPopup input")
          .trigger("focus")
          .trigger("select");
      });
  }
}

export function hide(): void {
  if (isPopupVisible(wrapperId)) {
    $("#newResultFilterPresetPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        125,
        () => {
          $("#newResultFilterPresetPopupWrapper").addClass("hidden");
          Skeleton.remove(wrapperId);
        }
      );
  }
}

function apply(): void {
  const name = $("#newResultFilterPresetPopup input").val() as string;
  if (callbackFunc) {
    callbackFunc(name);
  }
  hide();
}

$("#newResultFilterPresetPopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "newResultFilterPresetPopupWrapper") {
    hide();
  }
});

$("#newResultFilterPresetPopupWrapper input").on("keypress", (e) => {
  if (e.key === "Enter") {
    apply();
  }
});

$("#newResultFilterPresetPopupWrapper .button").on("click", () => {
  apply();
});

// this function is called to display the popup,
// it must specify the callback function to call once the name is selected
export function showNewResultFilterPresetPopup(
  callback: (name: string) => void
): void {
  callbackFunc = callback;
  show();
}

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && isPopupVisible(wrapperId)) {
    hide();
    event.preventDefault();
  }
});

Skeleton.save(wrapperId);
