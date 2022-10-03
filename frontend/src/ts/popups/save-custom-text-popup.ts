import * as CustomText from "../test/custom-text";
import * as Notifications from "../elements/notifications";

export async function show(): Promise<void> {
  $("#saveCustomTextPopupWrapper").removeClass("hidden");
  $("#customTextPopupWrapper").addClass("hidden");
  $("#saveCustomTextPopupWrapper .textName").val("");
  $("#saveCustomTextPopupWrapper .isLongText").prop("checked", false);
}

function hide(full = false): void {
  $("#saveCustomTextPopupWrapper").addClass("hidden");
  if (!full) $("#customTextPopupWrapper").removeClass("hidden");
}

function save(): void {
  const name = $("#saveCustomTextPopupWrapper .textName").val() as string;
  const text = ($(`#customTextPopup textarea`).val() as string).normalize();
  // const _checkbox = $("#saveCustomTextPopupWrapper .isLongText").prop("checked");

  CustomText.setCustomText(name, text);
  CustomText.setCustomTextProgress(name, 0);
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
