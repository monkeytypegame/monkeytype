import * as CustomText from "../test/custom-text";
import * as CustomTextState from "../states/custom-text-name";
import * as Skeleton from "./skeleton";
import { escapeHTML, isPopupVisible } from "../utils/misc";

const wrapperId = "savedTextsPopupWrapper";

function fill(): void {
  const names = CustomText.getCustomTextNames();
  const listEl = $(`#savedTextsPopup .list`).empty();
  let list = "";
  if (names.length === 0) {
    list += "<div>No saved custom texts found</div>";
  } else {
    for (const name of names) {
      list += `<div class="savedText">
      <div class="button name">${escapeHTML(name)}</div>
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
      <div class="button name">${escapeHTML(name)}</div>
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
}

let callbackFuncOnHide: (() => void) | undefined = undefined;

export async function show(
  noAnim = false,
  callbackOnHide?: () => void
): Promise<void> {
  Skeleton.append(wrapperId);
  if (!isPopupVisible(wrapperId)) {
    callbackFuncOnHide = callbackOnHide;
    fill();
    $("#savedTextsPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, noAnim ? 0 : 125);
  }
}

function hide(noAnim = false, noCallback = false): void {
  if (isPopupVisible(wrapperId)) {
    $("#savedTextsPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        noAnim ? 0 : 125,
        () => {
          $("#savedTextsPopupWrapper").addClass("hidden");
          Skeleton.remove(wrapperId);
          if (callbackFuncOnHide && !noCallback) callbackFuncOnHide();
        }
      );
  }
}

function applySaved(name: string, long: boolean): void {
  let text = CustomText.getCustomText(name, long);
  if (long) {
    text = text.slice(CustomText.getCustomTextLongProgress(name));
  }
  CustomText.setPopupTextareaState(text.join(CustomText.delimiter));
}

$("#popups").on(
  "click",
  `#savedTextsPopupWrapper .list .savedText .button.name`,
  (e) => {
    const name = $(e.target).text();
    CustomTextState.setCustomTextName(name, false);
    applySaved(name, false);
    hide(true);
  }
);

$("#popups").on(
  "click",
  `#savedTextsPopupWrapper .list .savedText .button.delete`,
  () => {
    hide(true, true);
  }
);

$("#popups").on(
  "click",
  `#savedTextsPopupWrapper .listLong .savedText .button.name`,
  (e) => {
    const name = $(e.target).text();
    CustomTextState.setCustomTextName(name, true);
    applySaved(name, true);
    hide(true);
  }
);

$("#popups").on(
  "click",
  `#savedTextsPopupWrapper .listLong .savedText .button.resetProgress`,
  () => {
    hide(true, true);
  }
);

$("#popups").on(
  "click",
  `#savedTextsPopupWrapper .listLong .savedText .button.delete`,
  () => {
    hide(true, true);
  }
);

$("#savedTextsPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "savedTextsPopupWrapper") {
    hide(true);
  }
});

Skeleton.save(wrapperId);
