import * as DB from "./db";
import * as TestUI from "./test-ui";
import * as Misc from "./misc";

export function saveActiveToCookie() {
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
    Misc.setCookie("activeTags", JSON.stringify(tags), 365);
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
  if (!nosave) saveActiveToCookie();
}

export function loadActiveFromCookie() {
  // let newTags = $.cookie("activeTags");
  let newTags = Misc.getCookie("activeTags");
  if (newTags !== undefined && newTags !== "") {
    try {
      newTags = JSON.parse(newTags);
    } catch (e) {
      newTags = {};
    }
    newTags.forEach((ntag) => {
      toggle(ntag, true);
    });
    saveActiveToCookie();
  }
}
