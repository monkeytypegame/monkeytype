import * as CustomText from "../test/custom-text";
import * as CustomTextState from "../states/custom-text-name";
import { escapeHTML } from "../utils/misc";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import { showPopup } from "../modals/simple-modals";

async function fill(): Promise<void> {
  const names = CustomText.getCustomTextNames();
  const listEl = $(`#savedTextsPopupWrapper .list`).empty();
  let list = "";
  if (names.length === 0) {
    list += "<div>No saved custom texts found</div>";
  } else {
    for (const name of names) {
      list += `<div class="savedText" data-name="${name}">
      <div class="button name">${escapeHTML(name)}</div>
      <div class="button delete">
      <i class="fas fa-fw fa-trash"></i>
      </div>
      </div>`;
    }
  }
  listEl.html(list);

  const longNames = CustomText.getCustomTextNames(true);
  const longListEl = $(`#savedTextsPopupWrapper .listLong`).empty();
  let longList = "";
  if (longNames.length === 0) {
    longList += "<div>No saved long custom texts found</div>";
  } else {
    for (const name of longNames) {
      longList += `<div class="savedLongText" data-name="${name}">
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

  $("#savedTextsPopupWrapper .list .savedText .button.delete").on(
    "click",
    (e) => {
      const name = $(e.target).closest(".savedText").data("name");
      showPopup("deleteCustomText", [name], {
        modalChain: modal,
      });
    }
  );

  $("#savedTextsPopupWrapper .listLong .savedLongText .button.delete").on(
    "click",
    (e) => {
      const name = $(e.target).closest(".savedLongText").data("name");
      showPopup("deleteCustomTextLong", [name], {
        modalChain: modal,
      });
    }
  );

  $(
    "#savedTextsPopupWrapper .listLong .savedLongText .button.resetProgress"
  ).on("click", (e) => {
    const name = $(e.target).closest(".savedLongText").data("name");
    showPopup("resetProgressCustomTextLong", [name], {
      modalChain: modal,
    });
  });

  $("#savedTextsPopupWrapper .list .savedText .button.name").on(
    "click",
    (e) => {
      const name = $(e.target).text();
      CustomTextState.setCustomTextName(name, false);
      applySaved(name, false);
      hide();
    }
  );

  $("#savedTextsPopupWrapper .listLong .savedLongText .button.name").on(
    "click",
    (e) => {
      const name = $(e.target).text();
      CustomTextState.setCustomTextName(name, true);
      applySaved(name, true);
      hide();
    }
  );
}

export async function show(options: ShowOptions): Promise<void> {
  // Skeleton.append(wrapperId, "popups");
  // if (!isPopupVisible(wrapperId)) {
  //   callbackFuncOnHide = callbackOnHide;
  //   fill();
  //   $("#savedTextsPopupWrapper")
  //     .stop(true, true)
  //     .css("opacity", 0)
  //     .removeClass("hidden")
  //     .animate({ opacity: 1 }, noAnim ? 0 : 125);
  // }
  void modal.show({
    ...options,
    beforeAnimation: async () => {
      void fill();
    },
  });
}

function hide(clearChain = false): void {
  // if (isPopupVisible(wrapperId)) {
  //   $("#savedTextsPopupWrapper")
  //     .stop(true, true)
  //     .css("opacity", 1)
  //     .animate(
  //       {
  //         opacity: 0,
  //       },
  //       noAnim ? 0 : 125,
  //       () => {
  //         $("#savedTextsPopupWrapper").addClass("hidden");
  //         Skeleton.remove(wrapperId);
  //         if (callbackFuncOnHide && !noCallback) callbackFuncOnHide();
  //       }
  //     );
  // }
  void modal.hide({
    clearModalChain: clearChain,
  });
}

function applySaved(name: string, long: boolean): void {
  let text = CustomText.getCustomText(name, long);
  if (long) {
    text = text.slice(CustomText.getCustomTextLongProgress(name));
  }
  CustomText.setPopupTextareaState(text.join(" "));
}

// $("#popups").on(
//   "click",
//   `#savedTextsPopupWrapper .list .savedText .button.name`,
//   (e) => {
//     const name = $(e.target).text();
//     CustomTextState.setCustomTextName(name, false);
//     applySaved(name, false);
//     hide(true);
//   }
// );

// $("#popups").on(
//   "click",
//   `#savedTextsPopupWrapper .listLong .savedText .button.name`,
//   (e) => {
//     const name = $(e.target).text();
//     CustomTextState.setCustomTextName(name, true);
//     applySaved(name, true);
//     hide(true);
//   }
// );

async function setup(): Promise<void> {
  //
}

const modal = new AnimatedModal({
  dialogId: "savedTextsPopupWrapper",
  setup,
});
