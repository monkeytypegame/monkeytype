import * as CustomText from "../test/custom-text";
import * as Notifications from "../elements/notifications";
import * as CustomTextState from "../states/custom-text-name";
import { InputIndicator } from "../elements/input-indicator";
import { debounce } from "throttle-debounce";
import * as Skeleton from "./skeleton";
import { isPopupVisible } from "../utils/misc";

const wrapperId = "saveCustomTextPopupWrapper";

const indicator = new InputIndicator($("#saveCustomTextPopup .textName"), {
  available: {
    icon: "fa-check",
    level: 1,
  },
  unavailable: {
    icon: "fa-times",
    level: -1,
  },
  loading: {
    icon: "fa-circle-notch",
    spinIcon: true,
    level: 0,
  },
});

let callbackFuncOnHide: (() => void) | undefined = undefined;

export async function show(
  noAnim = false,
  callbackOnHide: () => void | undefined
): Promise<void> {
  Skeleton.append(wrapperId);
  if (!isPopupVisible(wrapperId)) {
    callbackFuncOnHide = callbackOnHide;

    $("#saveCustomTextPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, noAnim ? 0 : 125, () => {
        $("#saveCustomTextPopupWrapper .textName").val("");
        $("#saveCustomTextPopupWrapper .isLongText").prop("checked", false);
        $("#saveCustomTextPopupWrapper .button.save").addClass("disabled");
      });
  }
}

function hide(noAnim = false): void {
  if (isPopupVisible(wrapperId)) {
    $("#saveCustomTextPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        noAnim ? 0 : 125,
        () => {
          $("#saveCustomTextPopupWrapper").addClass("hidden");
          Skeleton.remove(wrapperId);
          if (callbackFuncOnHide) callbackFuncOnHide();
        }
      );
  }
}

function save(): boolean {
  const name = $("#saveCustomTextPopupWrapper .textName").val() as string;
  const checkbox = $("#saveCustomTextPopupWrapper .isLongText").prop("checked");
  let text = CustomText.popupTextareaState.normalize();

  if (!name) {
    Notifications.add("Custom text needs a name", 0);
    return false;
  }

  if (text.length === 0) {
    Notifications.add("Custom text can't be empty", 0);
    return false;
  }

  text = text.replace(/( *(\r\n|\r|\n) *)/g, "\n ");

  CustomText.setCustomText(name, text, checkbox);
  CustomTextState.setCustomTextName(name, checkbox);
  Notifications.add("Custom text saved", 1);
  return true;
}

$("#popups").on("click", `#saveCustomTextPopupWrapper .button.save`, () => {
  if (save() === true) hide(true);
});

$("#saveCustomTextPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "saveCustomTextPopupWrapper") {
    hide(true);
  }
});

function updateIndicatorAndButton(): void {
  const val = $("#saveCustomTextPopup .textName").val() as string;
  const checkbox = $("#saveCustomTextPopupWrapper .isLongText").prop("checked");

  if (!val) {
    indicator.hide();
    $("#saveCustomTextPopupWrapper .button.save").addClass("disabled");
  } else {
    const names = CustomText.getCustomTextNames(checkbox);
    if (names.includes(val)) {
      indicator.show("unavailable");
      $("#saveCustomTextPopupWrapper .button.save").addClass("disabled");
    } else {
      indicator.show("available");
      $("#saveCustomTextPopupWrapper .button.save").removeClass("disabled");
    }
  }
}

const updateInputAndButtonDebounced = debounce(500, updateIndicatorAndButton);

$("#saveCustomTextPopup .textName").on("input", () => {
  const val = $("#saveCustomTextPopup .textName").val() as string;
  if (val.length > 0) {
    indicator.show("loading");
    updateInputAndButtonDebounced();
  }
});

$("#saveCustomTextPopupWrapper .isLongText").on("change", () => {
  const val = $("#saveCustomTextPopup .textName").val() as string;
  if (val.length > 0) {
    indicator.show("loading");
    updateInputAndButtonDebounced();
  }
});

Skeleton.save(wrapperId);
