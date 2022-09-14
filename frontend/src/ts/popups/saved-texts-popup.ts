import * as CustomText from "../test/custom-text";
import * as CustomTextState from "../states/custom-text";

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
      <div class="button ${
        CustomText.getCustomTextProgress(name) <= 0 ? "disabled" : ""
      } continue">continue</div>
      <div class="button delete">
      <i class="fas fa-fw fa-trash"></i>
      </div>
      </div>`;
    }
  }
  listEl.html(list);
  $("#savedTextsPopupWrapper").removeClass("hidden");
  $("#customTextPopupWrapper").addClass("hidden");
}

function hide(full = false): void {
  $("#savedTextsPopupWrapper").addClass("hidden");
  if (!full) $("#customTextPopupWrapper").removeClass("hidden");
}

function applySaved(name: string, progress = false): void {
  const text = CustomText.getCustomText(
    name,
    progress ? CustomText.getCustomTextProgress(name) : 0
  );
  $(`#customTextPopupWrapper textarea`).val(text.join(CustomText.delimiter));
}

$(document).on(
  "click",
  `#savedTextsPopupWrapper .list .savedText .button.name`,
  (e) => {
    const name = $(e.target).text();
    CustomTextState.setCustomTextName(name);
    applySaved(name);
    hide();
  }
);

$(document).on(
  "click",
  `#savedTextsPopupWrapper .list .savedText .button.continue`,
  (e) => {
    const name = $(e.target).siblings(`.button.name`).text();
    CustomTextState.setCustomTextName(name);
    applySaved(name, true);
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

$("#savedTextsPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "savedTextsPopupWrapper") {
    hide();
  }
});
