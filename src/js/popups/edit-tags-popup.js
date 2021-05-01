import * as ResultTagsPopup from "./result-tags-popup";
import * as ResultFilters from "./result-filters";
import * as Loader from "./loader";
import * as DB from "./db";
import * as CloudFunctions from "./cloud-functions";
import * as Notifications from "./notifications";
import * as Settings from "./settings";

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

function apply() {
  let action = $("#tagsWrapper #tagsEdit").attr("action");
  let inputVal = $("#tagsWrapper #tagsEdit input").val();
  let tagid = $("#tagsWrapper #tagsEdit").attr("tagid");
  hide();
  if (action === "add") {
    Loader.show();
    CloudFunctions.addTag({
      uid: firebase.auth().currentUser.uid,
      name: inputVal,
    }).then((e) => {
      Loader.hide();
      let status = e.data.resultCode;
      if (status === 1) {
        Notifications.add("Tag added", 1, 2);
        DB.getSnapshot().tags.push({
          name: inputVal,
          id: e.data.id,
        });
        ResultTagsPopup.updateButtons();
        Settings.update();
        ResultFilters.updateTags();
      } else if (status === -1) {
        Notifications.add("Invalid tag name", 0);
      } else if (status < -1) {
        Notifications.add("Unknown error: " + e.data.message, -1);
      }
    });
  } else if (action === "edit") {
    Loader.show();
    CloudFunctions.editTag({
      uid: firebase.auth().currentUser.uid,
      name: inputVal,
      tagid: tagid,
    }).then((e) => {
      Loader.hide();
      let status = e.data.resultCode;
      if (status === 1) {
        Notifications.add("Tag updated", 1);
        DB.getSnapshot().tags.forEach((tag) => {
          if (tag.id === tagid) {
            tag.name = inputVal;
          }
        });
        ResultTagsPopup.updateButtons();
        Settings.update();
        ResultFilters.updateTags();
      } else if (status === -1) {
        Notifications.add("Invalid tag name", 0);
      } else if (status < -1) {
        Notifications.add("Unknown error: " + e.data.message, -1);
      }
    });
  } else if (action === "remove") {
    Loader.show();
    CloudFunctions.removeTag({
      uid: firebase.auth().currentUser.uid,
      tagid: tagid,
    }).then((e) => {
      Loader.hide();
      let status = e.data.resultCode;
      if (status === 1) {
        Notifications.add("Tag removed", 1);
        DB.getSnapshot().tags.forEach((tag, index) => {
          if (tag.id === tagid) {
            DB.getSnapshot().tags.splice(index, 1);
          }
        });
        ResultTagsPopup.updateButtons();
        Settings.update();
        ResultFilters.updateTags();
      } else if (status < -1) {
        Notifications.add("Unknown error: " + e.data.message, -1);
      }
    });
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
