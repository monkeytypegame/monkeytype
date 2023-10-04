import * as ConnectionState from "../states/connection";
import * as Notifications from "../elements/notifications";
import * as Skeleton from "./skeleton";
import * as DB from "../db";
import * as Loader from "../elements/loader";
import Ape from "../ape";

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

async function updateTags(): Promise<void> {
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
  $(".tagCheckbox:checkbox:checked").each((_, checkedResult) => {
    const resultId = $(checkedResult).attr("value") ?? "";
    if (resultId) {
      resultsSelected.push(resultId);
    }
  });

  if (resultsSelected.length === 0) {
    Notifications.add("Please select at least 1 result to apply tags", 0, {
      duration: 200,
    });
    return;
  }

  Loader.show();
  const response = await Ape.results.batchUpdateTags(
    resultsSelected,
    tagsSelected
  );

  Loader.hide();
  if (response.status !== 200) {
    return Notifications.add("Failed to updated tags " + response?.message, -1);
  }

  DB.getSnapshot()?.results?.forEach(
    (result: MonkeyTypes.Result<MonkeyTypes.Mode>) => {
      if (resultsSelected.includes(result._id)) {
        result.tags = tagsSelected;
      }
    }
  );

  hide();
  Notifications.add("Tags updated", 1, {
    duration: 2,
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

$("#batchTagUpdatePopup .submitBatchUpdateTags").on("click", async () => {
  await updateTags();
});

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && isPopupVisible(wrapperId)) {
    hide();
    event.preventDefault();
  }
});

Skeleton.save(wrapperId);
