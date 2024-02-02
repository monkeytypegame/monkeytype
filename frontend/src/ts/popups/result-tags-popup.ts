import Ape from "../ape";
import * as DB from "../db";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import * as ConnectionState from "../states/connection";
import { areUnsortedArraysEqual, isPopupVisible } from "../utils/misc";
import * as Skeleton from "./skeleton";

const wrapperId = "resultEditTagsPanelWrapper";

const state: Record<string, string | undefined> = {
  resultId: undefined,
  tags: undefined,
  source: undefined,
};

function show(): void {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }
  Skeleton.append(wrapperId);
  updateButtons();
  if (!isPopupVisible(wrapperId)) {
    $("#resultEditTagsPanelWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125);
  }
}

function hide(): void {
  if (isPopupVisible(wrapperId)) {
    $("#resultEditTagsPanelWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        125,
        () => {
          $("#resultEditTagsPanelWrapper").addClass("hidden");
          Skeleton.remove(wrapperId);
        }
      );
  }
}

function updateButtons(): void {
  $("#resultEditTagsPanel .buttons").empty();
  DB.getSnapshot()?.tags?.forEach((tag) => {
    $("#resultEditTagsPanel .buttons").append(
      `<div class="button tag" tagid="${tag._id}">${tag.display}</div>`
    );
  });
}

function updateActiveButtons(active: string[]): void {
  if (active.length === 0) return;
  $.each($("#resultEditTagsPanel .buttons .button"), (_, obj) => {
    const tagid: string = $(obj).attr("tagid") ?? "";
    if (active.includes(tagid)) {
      $(obj).addClass("active");
    } else {
      $(obj).removeClass("active");
    }
  });
}

$(".pageAccount").on("click", ".group.history #resultEditTags", (f) => {
  if ((DB.getSnapshot()?.tags?.length ?? 0) > 0) {
    const resultid = $(f.target).parents("span").attr("resultid") as string;
    const tags = $(f.target).parents("span").attr("tags") as string;
    state["resultId"] = resultid;
    state["tags"] = tags;
    state["source"] = "accountPage";
    updateActiveButtons(JSON.parse(tags));
    show();
  } else {
    Notifications.add(
      "You haven't created any tags. You can do it in the settings page",
      0,
      {
        duration: 4,
      }
    );
  }
});

$(".pageTest").on("click", ".tags .editTagsButton", () => {
  if (DB.getSnapshot()?.tags?.length ?? 0 > 0) {
    const resultid = $(".pageTest .tags .editTagsButton").attr(
      "result-id"
    ) as string;
    const activeTagIds = $(".pageTest .tags .editTagsButton").attr(
      "active-tag-ids"
    ) as string;
    const tags = activeTagIds === "" ? [] : activeTagIds.split(",");
    state["resultId"] = resultid;
    state["tags"] = JSON.stringify(tags);
    state["source"] = "resultPage";
    show();
    updateActiveButtons(tags);
  }
});

$("#popups").on("click", "#resultEditTagsPanelWrapper .button.tag", (f) => {
  $(f.target).toggleClass("active");
});

$("#resultEditTagsPanelWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "resultEditTagsPanelWrapper") {
    hide();
  }
});

$("#resultEditTagsPanelWrapper .confirmButton").on("click", async () => {
  const resultId = state["resultId"] as string;

  const newTags: string[] = [];
  $.each($("#resultEditTagsPanel .buttons .button"), (_, obj) => {
    const tagid = $(obj).attr("tagid") ?? "";
    if ($(obj).hasClass("active")) {
      newTags.push(tagid);
    }
  });

  const currentTags = JSON.parse(state["tags"] as string);

  if (areUnsortedArraysEqual(currentTags, newTags)) {
    hide();
    return;
  }

  Loader.show();
  hide();

  const response = await Ape.results.updateTags(resultId, newTags);

  Loader.hide();
  if (response.status !== 200) {
    return Notifications.add(
      "Failed to update result tags: " + response.message,
      -1
    );
  }

  const responseTagPbs = response.data.tagPbs;

  Notifications.add("Tags updated", 1, {
    duration: 2,
  });
  DB.getSnapshot()?.results?.forEach(
    (result: SharedTypes.Result<SharedTypes.Mode>) => {
      if (result._id === resultId) {
        result.tags = newTags;
      }
    }
  );

  const tagNames: string[] = [];

  if (newTags.length > 0) {
    newTags.forEach((tag) => {
      DB.getSnapshot()?.tags?.forEach((snaptag) => {
        if (tag === snaptag._id) {
          tagNames.push(snaptag.display);
        }
      });
    });
  }

  let restags;
  if (newTags === undefined) {
    restags = "[]";
  } else {
    restags = JSON.stringify(newTags);
  }

  $(`.pageAccount #resultEditTags[resultid='${resultId}']`).attr(
    "tags",
    restags
  );
  const source = state["source"] as string;

  if (source === "accountPage") {
    if (newTags.length > 0) {
      $(`.pageAccount #resultEditTags[resultid='${resultId}']`).css(
        "opacity",
        1
      );
      $(`.pageAccount #resultEditTags[resultid='${resultId}']`).attr(
        "aria-label",
        tagNames.join(", ")
      );
    } else {
      $(`.pageAccount #resultEditTags[resultid='${resultId}']`).css(
        "opacity",
        0.25
      );
      $(`.pageAccount #resultEditTags[resultid='${resultId}']`).attr(
        "aria-label",
        "no tags"
      );
    }
  } else if (source === "resultPage") {
    if (newTags.length === 0) {
      $(`.pageTest #result .tags .bottom`).html(
        "<div class='noTags'>no tags</div>"
      );
    } else {
      $(`.pageTest #result .tags .bottom div.noTags`).remove();
      const currentElements = $(`.pageTest #result .tags .bottom div[tagid]`);

      const checked: string[] = [];
      currentElements.each((_, element) => {
        const tagId = $(element).attr("tagid") as string;
        if (!newTags.includes(tagId)) {
          $(element).remove();
        } else {
          checked.push(tagId);
        }
      });

      let html = "";

      newTags.forEach((tag, index) => {
        if (checked.includes(tag)) return;
        if (responseTagPbs.includes(tag)) {
          html += `<div tagid="${tag}" data-balloon-pos="up">${tagNames[index]}<i class="fas fa-crown"></i></div>`;
        } else {
          html += `<div tagid="${tag}">${tagNames[index]}</div>`;
        }
      });

      // $(`.pageTest #result .tags .bottom`).html(tagNames.join("<br>"));
      $(`.pageTest #result .tags .bottom`).append(html);
      $(`.pageTest #result .tags .top .editTagsButton`).attr(
        "active-tag-ids",
        newTags.join(",")
      );
    }
  }
});

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && isPopupVisible(wrapperId)) {
    hide();
    event.preventDefault();
  }
});

Skeleton.save(wrapperId);
