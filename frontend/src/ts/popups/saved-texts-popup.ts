import * as CustomText from "../test/custom-text";
import * as CustomTextState from "../states/custom-text-name";

export async function show(): Promise<void> {
  const names = CustomText.getCustomTextNames();
  const listEl = $(`#savedTextsPopup .list`).empty();
  let list = "";
  if (names.length === 0) {
    list += "<div>No saved custom texts found</div>";
  } else {
    for (const name of names) {
      list += `<div class="savedText">
      <div class="button name">${name}</div>
      <div class="button delete">
      <i class="fas fa-fw fa-trash"></i>
      </div>
      </div>`;
    }
  }
  listEl.html(list);

  const longNames = CustomText.getCustomTextNames(true);
  const longListEl = $(`#savedTextsPopup .listLong`).empty();
  let longList = "";
  if (longNames.length === 0) {
    longList += "<div>No saved long custom texts found</div>";
  } else {
    for (const name of longNames) {
      longList += `<div class="savedText">
      <div class="button name">${name}</div>
      <div class="button ${
        CustomText.getCustomTextLongProgress(name) <= 0 ? "disabled" : ""
      } resetProgress">reset</div>
      <div class="button delete">
      <i class="fas fa-fw fa-trash"></i>
      </div>
      </div>`;
    }
  }
  longListEl.html(longList);

  $("#savedTextsPopupWrapper").removeClass("hidden");
  $("#customTextPopupWrapper").addClass("hidden");
}

function hide(full = false): void {
  $("#savedTextsPopupWrapper").addClass("hidden");
  if (!full) {
    if (CustomTextState.isCustomTextLong() === true) {
      $(`#customTextPopup .longCustomTextWarning`).removeClass("hidden");
      $(`#customTextPopup .randomWordsCheckbox input`).prop("checked", false);
      $(`#customTextPopup .delimiterCheck input`).prop("checked", false);
      $(`#customTextPopup .typographyCheck`).prop("checked", true);
      $(`#customTextPopup .replaceNewlineWithSpace input`).prop(
        "checked",
        false
      );
      $(`#customTextPopup .inputs`).addClass("disabled");
    } else {
      $(`#customTextPopup .longCustomTextWarning`).addClass("hidden");
      $(`#customTextPopup .inputs`).removeClass("disabled");
    }
    $("#customTextPopupWrapper").removeClass("hidden");
  }
}

function applySaved(name: string, long: boolean): void {
  let text = CustomText.getCustomText(name, long);
  if (long) {
    text = text.slice(CustomText.getCustomTextLongProgress(name));
  }
  $(`#customTextPopupWrapper textarea`).val(text.join(CustomText.delimiter));
}

$(document).on(
  "click",
  `#savedTextsPopupWrapper .list .savedText .button.name`,
  (e) => {
    const name = $(e.target).text();
    CustomTextState.setCustomTextName(name, false);
    applySaved(name, false);
    hide();
  }
);

$(document).on(
  "click",
  `#savedTextsPopupWrapper .list .savedText .button.delete`,
  () => {
    hide(true);
  }
);

$(document).on(
  "click",
  `#savedTextsPopupWrapper .listLong .savedText .button.name`,
  (e) => {
    const name = $(e.target).text();
    CustomTextState.setCustomTextName(name, true);
    applySaved(name, true);
    hide();
  }
);

$(document).on(
  "click",
  `#savedTextsPopupWrapper .listLong .savedText .button.resetProgress`,
  () => {
    hide(true);
  }
);

$(document).on(
  "click",
  `#savedTextsPopupWrapper .listLong .savedText .button.delete`,
  () => {
    hide(true);
  }
);

$("#savedTextsPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "savedTextsPopupWrapper") {
    hide();
  }
});
