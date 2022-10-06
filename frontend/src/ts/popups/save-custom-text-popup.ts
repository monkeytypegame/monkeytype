import * as CustomText from "../test/custom-text";
import * as Notifications from "../elements/notifications";
import * as CustomTextState from "../states/custom-text-name";
import { InputIndicator } from "../elements/input-indicator";
import { debounce } from "throttle-debounce";

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

export async function show(): Promise<void> {
  $("#saveCustomTextPopupWrapper").removeClass("hidden");
  $("#customTextPopupWrapper").addClass("hidden");
  $("#saveCustomTextPopupWrapper .textName").val("");
  $("#saveCustomTextPopupWrapper .isLongText").prop("checked", false);
  $("#saveCustomTextPopupWrapper .button.save").addClass("disabled");
}

function hide(full = false): void {
  $("#saveCustomTextPopupWrapper").addClass("hidden");
  if (!full) {
    $("#customTextPopupWrapper").removeClass("hidden").css("opacity", 1);
  }
}

function save(): boolean {
  const name = $("#saveCustomTextPopupWrapper .textName").val() as string;
  const text = ($(`#customTextPopup textarea`).val() as string).normalize();
  const checkbox = $("#saveCustomTextPopupWrapper .isLongText").prop("checked");

  if (!name) {
    Notifications.add("Custom text needs a name", 0);
    return false;
  }

  CustomText.setCustomText(name, text, checkbox);
  CustomTextState.setCustomTextName(name, checkbox);
  Notifications.add("Custom text saved", 1);
  return true;
}

$(document).on("click", `#saveCustomTextPopupWrapper .button.save`, () => {
  if (save() === true) hide();
});

$("#saveCustomTextPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "saveCustomTextPopupWrapper") {
    hide();
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
