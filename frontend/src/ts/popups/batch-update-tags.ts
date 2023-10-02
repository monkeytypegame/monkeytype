import * as ConnectionState from "../states/connection";
import * as Notifications from "../elements/notifications";
import * as Skeleton from "./skeleton";
import * as DB from "../db";
import { isPopupVisible } from "../utils/misc";

const wrapperId = "batchTagUpdatePopupWrapper";

let callbackFuncOnHide: (() => void) | null = null;

export function show(callbackOnHide: () => void): void {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, { duration: 2 });
    return;
  }
  Skeleton.append(wrapperId);
  updateButtons();
  if (!isPopupVisible(wrapperId)) {
    callbackFuncOnHide = callbackOnHide;
    $(`#${wrapperId}`)
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125);
  }
}

export function hide(): void {
  if (isPopupVisible(wrapperId)) {
    callbackFuncOnHide && callbackFuncOnHide();
    $(`#${wrapperId}`)
      .stop(true, true)
      .css("opacity", 1)
      .animate({ opacity: 0 }, 125, () => {
        $(`#${wrapperId}`).addClass("hidden");
        Skeleton.remove(wrapperId);
      });
  }
}

function updateButtons(): void {
  $("#batchTagUpdatePopup .buttons").empty();
  DB.getSnapshot()?.tags?.forEach((tag) => {
    $("#batchTagUpdatePopup .buttons").append(
      `<div class="button tag" tagid="${tag._id}">${tag.display}</div>`
    );
  });
}

$("#popups").on("click", "#batchTagUpdatePopupWrapper .button.tag", (e) => {
  $(e.target).toggleClass("active");
});

$(`#${wrapperId}`).on("click", (e) => {
  if ($(e.target).attr("id") === wrapperId) {
    hide();
  }
});

$("#batchTagUpdatePopup .submitBatchUpdateTags").on("click", () => {
  const tagsSelected: string[] = [];
  $.each($("#batchTagUpdatePopup .buttons .button"), (_, obj) => {
    const tagid = $(obj).attr("tagid") ?? "";
    if ($(obj).hasClass("active")) {
      tagsSelected.push(tagid);
    }
  });

  if (tagsSelected.length === 0) {
    Notifications.add("Please select at least 1 tag", 0, { duration: 200 });
    return;
  }

  const resultsSelected: string[] = [];
  const checkedResults = $(".tagCheckbox:checkbox:checked").each(
    (_, checkedResult) => {
      const resultId = $(checkedResult).attr("value") ?? "";
      resultsSelected.push(resultId);
    }
  );

  if (checkedResults.length === 0) {
    Notifications.add("Please select at least 1 result to apply tags", 0, {
      duration: 200,
    });
    return;
  }
});

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && isPopupVisible(wrapperId)) {
    hide();
    event.preventDefault();
  }
});

Skeleton.save(wrapperId);
