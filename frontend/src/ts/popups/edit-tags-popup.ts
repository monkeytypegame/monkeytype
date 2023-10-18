import Ape from "../ape";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as Loader from "../elements/loader";
import * as Settings from "../pages/settings";
import * as ConnectionState from "../states/connection";
import * as Skeleton from "./skeleton";
import { isPopupVisible } from "../utils/misc";

const wrapperId = "tagsWrapper";

export function show(action: string, id?: string, name?: string): void {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }

  Skeleton.append(wrapperId);

  if (action === "add") {
    $("#tagsWrapper #tagsEdit").attr("action", "add");
    $("#tagsWrapper #tagsEdit .title").html("Add new tag");
    $("#tagsWrapper #tagsEdit button").html(`add`);
    $("#tagsWrapper #tagsEdit input").val("");
    $("#tagsWrapper #tagsEdit input").removeClass("hidden");
  } else if (action === "edit" && id && name) {
    $("#tagsWrapper #tagsEdit").attr("action", "edit");
    $("#tagsWrapper #tagsEdit").attr("tagid", id);
    $("#tagsWrapper #tagsEdit .title").html("Edit tag name");
    $("#tagsWrapper #tagsEdit button").html(`save`);
    $("#tagsWrapper #tagsEdit input").val(name);
    $("#tagsWrapper #tagsEdit input").removeClass("hidden");
  } else if (action === "remove" && id && name) {
    $("#tagsWrapper #tagsEdit").attr("action", "remove");
    $("#tagsWrapper #tagsEdit").attr("tagid", id);
    $("#tagsWrapper #tagsEdit .title").html("Delete tag " + name);
    $("#tagsWrapper #tagsEdit button").html(`delete`);
    $("#tagsWrapper #tagsEdit input").addClass("hidden");
  } else if (action === "clearPb" && id && name) {
    $("#tagsWrapper #tagsEdit").attr("action", "clearPb");
    $("#tagsWrapper #tagsEdit").attr("tagid", id);
    $("#tagsWrapper #tagsEdit .title").html("Clear PB for tag " + name);
    $("#tagsWrapper #tagsEdit button").html(`clear`);
    $("#tagsWrapper #tagsEdit input").addClass("hidden");
  }

  if (!isPopupVisible(wrapperId)) {
    $("#tagsWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {
        const input = $("#tagsWrapper #tagsEdit input");
        if (!input.hasClass("hidden")) {
          $("#tagsWrapper #tagsEdit input").trigger("focus");
        } else {
          $("#tagsWrapper").trigger("focus");
        }
      });
  }
}

function hide(): void {
  if (isPopupVisible(wrapperId)) {
    $("#tagsWrapper #tagsEdit").attr("action", "");
    $("#tagsWrapper #tagsEdit").attr("tagid", "");
    $("#tagsWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        125,
        () => {
          $("#tagsWrapper").addClass("hidden");
          Skeleton.remove(wrapperId);
        }
      );
  }
}

async function apply(): Promise<void> {
  const action = $("#tagsWrapper #tagsEdit").attr("action");
  const propTagName = $("#tagsWrapper #tagsEdit input").val() as string;
  const tagName = propTagName.replaceAll(" ", "_");
  const tagId = $("#tagsWrapper #tagsEdit").attr("tagid") as string;

  hide();
  Loader.show();

  if (action === "add") {
    const response = await Ape.users.createTag(tagName);

    if (response.status !== 200) {
      Notifications.add(
        "Failed to add tag: " + response.message.replace(tagName, propTagName),
        -1
      );
    } else {
      Notifications.add("Tag added", 1);
      DB.getSnapshot()?.tags?.push({
        display: propTagName,
        name: response.data.name,
        _id: response.data._id,
        personalBests: {
          time: {},
          words: {},
          quote: {},
          zen: {},
          custom: {},
        },
      });
      Settings.update();
    }
  } else if (action === "edit") {
    const response = await Ape.users.editTag(tagId, tagName);

    if (response.status !== 200) {
      Notifications.add("Failed to edit tag: " + response.message, -1);
    } else {
      Notifications.add("Tag updated", 1);
      DB.getSnapshot()?.tags?.forEach((tag) => {
        if (tag._id === tagId) {
          tag.name = tagName;
          tag.display = propTagName;
        }
      });
      Settings.update();
    }
  } else if (action === "remove") {
    const response = await Ape.users.deleteTag(tagId);

    if (response.status !== 200) {
      Notifications.add("Failed to remove tag: " + response.message, -1);
    } else {
      Notifications.add("Tag removed", 1);
      DB.getSnapshot()?.tags?.forEach((tag, index: number) => {
        if (tag._id === tagId) {
          DB.getSnapshot()?.tags?.splice(index, 1);
        }
      });
      Settings.update();
    }
  } else if (action === "clearPb") {
    const response = await Ape.users.deleteTagPersonalBest(tagId);

    if (response.status !== 200) {
      Notifications.add("Failed to clear tag pb: " + response.message, -1);
    } else {
      Notifications.add("Tag PB cleared", 1);
      DB.getSnapshot()?.tags?.forEach((tag) => {
        if (tag._id === tagId) {
          tag.personalBests = {
            time: {},
            words: {},
            quote: {},
            zen: {},
            custom: {},
          };
        }
      });
      Settings.update();
    }
  }
  Loader.hide();
}

$("#tagsWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "tagsWrapper") {
    hide();
  }
});

$("#tagsWrapper #tagsEdit form").on("submit", (e) => {
  e.preventDefault();
  apply();
});

$(".pageSettings .section.tags").on("click", ".addTagButton", () => {
  show("add");
});

$(".pageSettings .section.tags").on(
  "click",
  ".tagsList .tag .editButton",
  (e) => {
    const tagid = $(e.currentTarget).parent(".tag").attr("data-id");
    const name = $(e.currentTarget).parent(".tag").attr("data-display");
    show("edit", tagid, name);
  }
);

$(".pageSettings .section.tags").on(
  "click",
  ".tagsList .tag .clearPbButton",
  (e) => {
    const tagid = $(e.currentTarget).parent(".tag").attr("data-id");
    const name = $(e.currentTarget).parent(".tag").attr("data-display");
    show("clearPb", tagid, name);
  }
);

$(".pageSettings .section.tags").on(
  "click",
  ".tagsList .tag .removeButton",
  (e) => {
    const tagid = $(e.currentTarget).parent(".tag").attr("data-id");
    const name = $(e.currentTarget).parent(".tag").attr("data-display");
    show("remove", tagid, name);
  }
);

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && isPopupVisible(wrapperId)) {
    hide();
    event.preventDefault();
  }
});

Skeleton.save(wrapperId);
