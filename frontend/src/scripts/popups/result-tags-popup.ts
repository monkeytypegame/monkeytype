import Ape from "../ape";
import * as DB from "../db";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";

function show(): void {
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
  DB.getSnapshot().tags?.forEach((tag) => {
    $("#resultEditTagsPanel .buttons").append(
      `<div class="button tag" tagid="${tag._id}">${tag.name}</div>`
    );
  });
}

function updateActiveButtons(active: string[]): void {
  if (active === []) return;
  $.each($("#resultEditTagsPanel .buttons .button"), (_, obj) => {
    const tagid: string = $(obj).attr("tagid") ?? "";
    if (active.includes(tagid)) {
      $(obj).addClass("active");
    } else {
      $(obj).removeClass("active");
    }
  });
}

$(document).on("click", ".pageAccount .group.history #resultEditTags", (f) => {
  if (DB.getSnapshot().tags?.length || 0 > 0) {
    const resultid = $(f.target).parents("span").attr("resultid") as string;
    const tags = $(f.target).parents("span").attr("tags") as string;
    $("#resultEditTagsPanel").attr("resultid", resultid);
    $("#resultEditTagsPanel").attr("tags", tags);
    updateActiveButtons(JSON.parse(tags));
    show();
  }
});

$(document).on("click", "#resultEditTagsPanelWrapper .button.tag", (f) => {
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

  Notifications.add("Tags updated.", 1, 2);
  DB.getSnapshot().results?.forEach(
    (result: MonkeyTypes.Result<MonkeyTypes.Mode>) => {
      if (result._id === resultId) {
        result.tags = newTags;
      }
    }
  );

  let tagNames = "";

  if (newTags.length > 0) {
    newTags.forEach((tag) => {
      DB.getSnapshot().tags?.forEach((snaptag) => {
        if (tag === snaptag._id) {
          tagNames += snaptag.name + ", ";
        }
      });
    });
    tagNames = tagNames.substring(0, tagNames.length - 2);
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
  if (newTags.length > 0) {
    $(`.pageAccount #resultEditTags[resultid='${resultId}']`).css("opacity", 1);
    $(`.pageAccount #resultEditTags[resultid='${resultId}']`).attr(
      "aria-label",
      tagNames
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
});
