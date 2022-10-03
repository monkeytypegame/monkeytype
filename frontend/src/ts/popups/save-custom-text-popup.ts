import * as CustomText from "../test/custom-text";
import * as Notifications from "../elements/notifications";
import * as CustomTextState from "../states/custom-text-name";

export async function show(): Promise<void> {
  $("#saveCustomTextPopupWrapper").removeClass("hidden");
  $("#customTextPopupWrapper").addClass("hidden");
  $("#saveCustomTextPopupWrapper .textName").val("");
  $("#saveCustomTextPopupWrapper .isLongText").prop("checked", false);
}

function hide(full = false): void {
  $("#saveCustomTextPopupWrapper").addClass("hidden");
  if (!full) {
    $("#customTextPopupWrapper").removeClass("hidden").css("opacity", 1);
  }
}

function save(): void {
  const name = $("#saveCustomTextPopupWrapper .textName").val() as string;
  const text = ($(`#customTextPopup textarea`).val() as string).normalize();
  const checkbox = $("#saveCustomTextPopupWrapper .isLongText").prop("checked");

  CustomText.setCustomText(name, text, checkbox);
  CustomTextState.setCustomTextName(name, checkbox);
  Notifications.add("Custom text saved", 1);
}

$(document).on("click", `#saveCustomTextPopupWrapper .button.save`, () => {
  save();
  hide();
});

$("#saveCustomTextPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "saveCustomTextPopupWrapper") {
    hide();
  }
});
