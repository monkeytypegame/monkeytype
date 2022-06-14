import * as CustomText from "../test/custom-text";

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
  $("#savedTextsPopupWrapper").removeClass("hidden");
  $("#customTextPopupWrapper").addClass("hidden");
}

function hide(full = false): void {
  $("#savedTextsPopupWrapper").addClass("hidden");
  if (!full) $("#customTextPopupWrapper").removeClass("hidden");
}

function applySaved(name: string): void {
  const text = CustomText.getCustomText(name);
  $(`#customTextPopupWrapper textarea`).val(text.join(CustomText.delimiter));
}

$(document).on(
  "click",
  `#savedTextsPopupWrapper .list .savedText .button.name`,
  (e) => {
    const name = $(e.target).text();
    applySaved(name);
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

$("#savedTextsPopupWrapper").mousedown((e) => {
  if ($(e.target).attr("id") === "savedTextsPopupWrapper") {
    hide();
  }
});
