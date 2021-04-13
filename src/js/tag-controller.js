import * as DB from "./db";
import * as TestUI from "./test-ui";

export function saveActiveToLocalStorage() {
  let tags = [];

  try {
    DB.getSnapshot().tags.forEach((tag) => {
      if (tag.active === true) {
        tags.push(tag.id);
      }
    });
    // let d = new Date();
    // d.setFullYear(d.getFullYear() + 1);
    // $.cookie("activeTags", null);
    // $.cookie("activeTags", JSON.stringify(tags), {
    //   expires: d,
    //   path: "/",
    // });
    window.localStorage.setItem("activeTags", JSON.stringify(tags));
  } catch (e) {}
}

export function toggle(tagid, nosave = false) {
  DB.getSnapshot().tags.forEach((tag) => {
    if (tag.id === tagid) {
      if (tag.active === undefined) {
        tag.active = true;
      } else {
        tag.active = !tag.active;
      }
    }
  });
  TestUI.updateModesNotice();
  if (!nosave) saveActiveToLocalStorage();
}

export function loadActiveFromLocalStorage() {
  // let newTags = $.cookie("activeTags");
  let newTags = window.localStorage.getItem("activeTags");
  if (newTags != undefined && newTags !== "") {
    try {
      newTags = JSON.parse(newTags);
    } catch (e) {
      newTags = {};
    }
    newTags.forEach((ntag) => {
      toggle(ntag, true);
    });
    saveActiveToLocalStorage();
  }
}
