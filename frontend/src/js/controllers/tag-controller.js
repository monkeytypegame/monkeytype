import * as DB from "../db";
import * as ModesNotice from "./../elements/modes-notice";

export function saveActiveToLocalStorage() {
  let tags = [];

  try {
    DB.getSnapshot().tags.forEach((tag) => {
      if (tag.active === true) {
        tags.push(tag._id);
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

export function clear(nosave = false) {
  DB.getSnapshot().tags.forEach((tag) => {
    tag.active = false;
  });
  ModesNotice.update();
  if (!nosave) saveActiveToLocalStorage();
}

export function set(tagid, state, nosave = false) {
  DB.getSnapshot().tags.forEach((tag) => {
    if (tag._id === tagid) {
      tag.active = state;
    }
  });
  ModesNotice.update();
  if (!nosave) saveActiveToLocalStorage();
}

export function toggle(tagid, nosave = false) {
  DB.getSnapshot().tags.forEach((tag) => {
    if (tag._id === tagid) {
      if (tag.active === undefined) {
        tag.active = true;
      } else {
        tag.active = !tag.active;
      }
    }
  });
  ModesNotice.update();
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
