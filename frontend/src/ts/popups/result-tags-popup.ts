import Ape from "../ape";
import * as DB from "../db";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import * as ConnectionState from "../states/connection";
import { areUnsortedArraysEqual } from "../utils/misc";

function show(): void {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, 2);
    return;
  }
  if ($("#resultEditTagsPanelWrapper").hasClass("hidden")) {
    $("#resultEditTagsPanelWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125);
  }
}

function hide(): void {
  if (!$("#resultEditTagsPanelWrapper").hasClass("hidden")) {
    $("#resultEditTagsPanelWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#resultEditTagsPanelWrapper").addClass("hidden");
        }
      );
  }
}

export function updateButtons(): void {
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
    $("#resultEditTagsPanel").attr("resultid", resultid);
    $("#resultEditTagsPanel").attr("tags", tags);
    $("#resultEditTagsPanel").attr("source", "accountPage");
    updateActiveButtons(JSON.parse(tags));
    show();
  } else {
    Notifications.add(
      "You haven't created any tags. You can do it in the settings page",
      0,
      4
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
    const tags = activeTagIds == "" ? [] : activeTagIds.split(",");
    $("#resultEditTagsPanel").attr("resultid", resultid);
    $("#resultEditTagsPanel").attr("tags", JSON.stringify(tags));
    $("#resultEditTagsPanel").attr("source", "resultPage");
    updateActiveButtons(tags);
    show();
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

$("#resultEditTagsPanel .confirmButton").on("click", async () => {
  const resultId = $("#resultEditTagsPanel").attr("resultid") as string;
  // let oldtags = JSON.parse($("#resultEditTagsPanel").attr("tags"));

  const newTags: string[] = [];
  $.each($("#resultEditTagsPanel .buttons .button"), (_, obj) => {
    const tagid = $(obj).attr("tagid") ?? "";
    if ($(obj).hasClass("active")) {
      newTags.push(tagid);
    }
  });

  const currentTags = JSON.parse(
    $("#resultEditTagsPanel").attr("tags") as string
  );

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

  Notifications.add("Tags updated", 1, 2);
  DB.getSnapshot()?.results?.forEach(
    (result: MonkeyTypes.Result<MonkeyTypes.Mode>) => {
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
  const source = $("#resultEditTagsPanel").attr("source") as string;

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
});
