import * as ResultTagsPopup from "./result-tags-popup";
import * as ResultFilters from "../account/result-filters";
import * as Loader from "../elements/loader";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as Settings from "../pages/settings";
import axiosInstance from "../axios-instance";

export function show(action, id, name) {
  if (action === "add") {
    $("#tagsWrapper #tagsEdit").attr("action", "add");
    $("#tagsWrapper #tagsEdit .title").html("Add new tag");
    $("#tagsWrapper #tagsEdit .button").html(`<i class="fas fa-plus"></i>`);
    $("#tagsWrapper #tagsEdit input").val("");
    $("#tagsWrapper #tagsEdit input").removeClass("hidden");
  } else if (action === "edit") {
    $("#tagsWrapper #tagsEdit").attr("action", "edit");
    $("#tagsWrapper #tagsEdit").attr("tagid", id);
    $("#tagsWrapper #tagsEdit .title").html("Edit tag name");
    $("#tagsWrapper #tagsEdit .button").html(`<i class="fas fa-pen"></i>`);
    $("#tagsWrapper #tagsEdit input").val(name);
    $("#tagsWrapper #tagsEdit input").removeClass("hidden");
  } else if (action === "remove") {
    $("#tagsWrapper #tagsEdit").attr("action", "remove");
    $("#tagsWrapper #tagsEdit").attr("tagid", id);
    $("#tagsWrapper #tagsEdit .title").html("Remove tag " + name);
    $("#tagsWrapper #tagsEdit .button").html(`<i class="fas fa-check"></i>`);
    $("#tagsWrapper #tagsEdit input").addClass("hidden");
  } else if (action === "clearPb") {
    $("#tagsWrapper #tagsEdit").attr("action", "clearPb");
    $("#tagsWrapper #tagsEdit").attr("tagid", id);
    $("#tagsWrapper #tagsEdit .title").html("Clear PB for tag " + name);
    $("#tagsWrapper #tagsEdit .button").html(`<i class="fas fa-check"></i>`);
    $("#tagsWrapper #tagsEdit input").addClass("hidden");
  }

  if ($("#tagsWrapper").hasClass("hidden")) {
    $("#tagsWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        $("#tagsWrapper #tagsEdit input").focus();
      });
  }
}

function hide() {
  if (!$("#tagsWrapper").hasClass("hidden")) {
    $("#tagsWrapper #tagsEdit").attr("action", "");
    $("#tagsWrapper #tagsEdit").attr("tagid", "");
    $("#tagsWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#tagsWrapper").addClass("hidden");
        }
      );
  }
}

async function apply() {
  // console.log(DB.getSnapshot());
  let action = $("#tagsWrapper #tagsEdit").attr("action");
  let inputVal = $("#tagsWrapper #tagsEdit input").val();
  let tagid = $("#tagsWrapper #tagsEdit").attr("tagid");
  hide();
  if (action === "add") {
    Loader.show();
    let response;
    try {
      response = await axiosInstance.post("/user/tags", {
        tagName: inputVal,
      });
    } catch (e) {
      Loader.hide();
      let msg = e?.response?.data?.message ?? e.message;
      Notifications.add("Failed to add tag: " + msg, -1);
      return;
    }
    Loader.hide();
    if (response.status !== 200) {
      Notifications.add(response.data.message);
    } else {
      Notifications.add("Tag added", 1);
      DB.getSnapshot().tags.push({
        name: response.data.name,
        _id: response.data._id,
      });
      ResultTagsPopup.updateButtons();
      Settings.update();
      ResultFilters.updateTags();
    }
  } else if (action === "edit") {
    Loader.show();
    let response;
    try {
      response = await axiosInstance.patch("/user/tags", {
        tagId: tagid,
        newName: inputVal,
      });
    } catch (e) {
      Loader.hide();
      let msg = e?.response?.data?.message ?? e.message;
      Notifications.add("Failed to edit tag: " + msg, -1);
      return;
    }
    Loader.hide();
    if (response.status !== 200) {
      Notifications.add(response.data.message);
    } else {
      Notifications.add("Tag updated", 1);
      DB.getSnapshot().tags.forEach((tag) => {
        if (tag._id === tagid) {
          tag.name = inputVal;
        }
      });
      ResultTagsPopup.updateButtons();
      Settings.update();
      ResultFilters.updateTags();
    }
  } else if (action === "remove") {
    Loader.show();
    let response;
    try {
      response = await axiosInstance.delete(`/user/tags/${tagid}`);
    } catch (e) {
      Loader.hide();
      let msg = e?.response?.data?.message ?? e.message;
      Notifications.add("Failed to remove tag: " + msg, -1);
      return;
    }
    Loader.hide();
    if (response.status !== 200) {
      Notifications.add(response.data.message);
    } else {
      Notifications.add("Tag removed", 1);
      DB.getSnapshot().tags.forEach((tag, index) => {
        if (tag._id === tagid) {
          DB.getSnapshot().tags.splice(index, 1);
        }
      });
      ResultTagsPopup.updateButtons();
      Settings.update();
      ResultFilters.updateTags();
    }
  } else if (action === "clearPb") {
    Loader.show();
    let response;
    try {
      response = await axiosInstance.delete(`/user/tags/${tagid}/personalBest`);
    } catch (e) {
      Loader.hide();
      let msg = e?.response?.data?.message ?? e.message;
      Notifications.add("Failed to clear tag pb: " + msg, -1);
      return;
    }
    Loader.hide();
    if (response.status !== 200) {
      Notifications.add(response.data.message);
    } else {
      Notifications.add("Tag PB cleared", 1);
      DB.getSnapshot().tags.forEach((tag) => {
        if (tag._id === tagid) {
          tag.personalBests = {};
        }
      });
      ResultTagsPopup.updateButtons();
      Settings.update();
      ResultFilters.updateTags();
    }
  }
}

$("#tagsWrapper").click((e) => {
  if ($(e.target).attr("id") === "tagsWrapper") {
    hide();
  }
});

$("#tagsWrapper #tagsEdit .button").click(() => {
  apply();
});

$("#tagsWrapper #tagsEdit input").keypress((e) => {
  if (e.keyCode == 13) {
    apply();
  }
});

$(document).on("click", ".pageSettings .section.tags .addTagButton", (e) => {
  show("add");
});

$(document).on(
  "click",
  ".pageSettings .section.tags .tagsList .tag .editButton",
  (e) => {
    let tagid = $(e.currentTarget).parent(".tag").attr("id");
    let name = $(e.currentTarget)
      .siblings(".tagButton")
      .children(".title")
      .text();
    show("edit", tagid, name);
  }
);

$(document).on(
  "click",
  ".pageSettings .section.tags .tagsList .tag .clearPbButton",
  (e) => {
    let tagid = $(e.currentTarget).parent(".tag").attr("id");
    let name = $(e.currentTarget)
      .siblings(".tagButton")
      .children(".title")
      .text();
    show("clearPb", tagid, name);
  }
);

$(document).on(
  "click",
  ".pageSettings .section.tags .tagsList .tag .removeButton",
  (e) => {
    let tagid = $(e.currentTarget).parent(".tag").attr("id");
    let name = $(e.currentTarget)
      .siblings(".tagButton")
      .children(".title")
      .text();
    show("remove", tagid, name);
  }
);
