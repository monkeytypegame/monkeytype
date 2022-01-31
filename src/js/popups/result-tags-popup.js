import * as DB from "./db";
import * as Loader from "./loader";
import * as Notifications from "./notifications";
import axiosInstance from "./axios-instance";

function show() {
  if ($("#resultEditTagsPanelWrapper").hasClass("hidden")) {
    $("#resultEditTagsPanelWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125);
  }
}

function hide() {
  if (!$("#resultEditTagsPanelWrapper").hasClass("hidden")) {
    $("#resultEditTagsPanelWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#resultEditTagsPanelWrapper").addClass("hidden");
        }
      );
  }
}

export function updateButtons() {
  $("#resultEditTagsPanel .buttons").empty();
  DB.getSnapshot().tags.forEach((tag) => {
    $("#resultEditTagsPanel .buttons").append(
      `<div class="button tag" tagid="${tag._id}">${tag.name}</div>`
    );
  });
}

function updateActiveButtons(active) {
  if (active === []) return;
  $.each($("#resultEditTagsPanel .buttons .button"), (index, obj) => {
    let tagid = $(obj).attr("tagid");
    if (active.includes(tagid)) {
      $(obj).addClass("active");
    } else {
      $(obj).removeClass("active");
    }
  });
}

$(document).on("click", ".pageAccount .group.history #resultEditTags", (f) => {
  if (DB.getSnapshot().tags.length > 0) {
    let resultid = $(f.target).parents("span").attr("resultid");
    let tags = $(f.target).parents("span").attr("tags");
    $("#resultEditTagsPanel").attr("resultid", resultid);
    $("#resultEditTagsPanel").attr("tags", tags);
    updateActiveButtons(JSON.parse(tags));
    show();
  }
});

$(document).on("click", "#resultEditTagsPanelWrapper .button.tag", (f) => {
  $(f.target).toggleClass("active");
});

$("#resultEditTagsPanelWrapper").click((e) => {
  if ($(e.target).attr("id") === "resultEditTagsPanelWrapper") {
    hide();
  }
});

$("#resultEditTagsPanel .confirmButton").click((e) => {
  let resultid = $("#resultEditTagsPanel").attr("resultid");
  // let oldtags = JSON.parse($("#resultEditTagsPanel").attr("tags"));

  let newtags = [];
  $.each($("#resultEditTagsPanel .buttons .button"), (index, obj) => {
    let tagid = $(obj).attr("tagid");
    if ($(obj).hasClass("active")) {
      newtags.push(tagid);
    }
  });
  Loader.show();
  hide();
  axiosInstance
    .post("/results/updateTags", {
      tags: newtags,
      resultid: resultid,
    })
    .then((response) => {
      Loader.hide();

      if (response.status !== 200) {
        Notifications.add(response.data.message);
      } else {
        Notifications.add("Tags updated.", 1, 2);
        DB.getSnapshot().results.forEach((result) => {
          if (result._id === resultid) {
            result.tags = newtags;
          }
        });

        let tagNames = "";

        if (newtags.length > 0) {
          newtags.forEach((tag) => {
            DB.getSnapshot().tags.forEach((snaptag) => {
              if (tag === snaptag._id) {
                tagNames += snaptag.name + ", ";
              }
            });
          });
          tagNames = tagNames.substring(0, tagNames.length - 2);
        }

        let restags;
        if (newtags === undefined) {
          restags = "[]";
        } else {
          restags = JSON.stringify(newtags);
        }

        $(`.pageAccount #resultEditTags[resultid='${resultid}']`).attr(
          "tags",
          restags
        );
        if (newtags.length > 0) {
          $(`.pageAccount #resultEditTags[resultid='${resultid}']`).css(
            "opacity",
            1
          );
          $(`.pageAccount #resultEditTags[resultid='${resultid}']`).attr(
            "aria-label",
            tagNames
          );
        } else {
          $(`.pageAccount #resultEditTags[resultid='${resultid}']`).css(
            "opacity",
            0.25
          );
          $(`.pageAccount #resultEditTags[resultid='${resultid}']`).attr(
            "aria-label",
            "no tags"
          );
        }
      }
    })
    .catch((e) => {
      Loader.hide();
      let msg = e?.response?.data?.message ?? e.message;
      Notifications.add("Failed to update result tags: " + msg, -1);
    });
});
