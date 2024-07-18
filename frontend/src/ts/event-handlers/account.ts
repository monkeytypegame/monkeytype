import * as PbTablesModal from "../modals/pb-tables.js";
import * as EditProfileModal from "../modals/edit-profile.js";
import { getSnapshot } from "../db.js";
import { isAuthenticated } from "../firebase.js";
import * as Notifications from "../elements/notifications.js";
import * as EditResultTagsModal from "../modals/edit-result-tags.js";
import * as AddFilterPresetModal from "../modals/new-filter-preset.js";

const accountPage = document.querySelector("#pageAccount") as HTMLElement;

$(accountPage).on("click", ".pbsTime .showAllButton", () => {
  PbTablesModal.show("time");
});

$(accountPage).on("click", ".pbsWords .showAllButton", () => {
  PbTablesModal.show("words");
});

$(accountPage).on("click", ".editProfileButton", () => {
  if (!isAuthenticated()) {
    Notifications.add("You must be logged in to edit your profile", 0);
    return;
  }
  const snapshot = getSnapshot();
  if (!snapshot) {
    Notifications.add(
      "Failed to open edit profile modal: No user snapshot found",
      -1
    );
    return;
  }
  if (snapshot.banned === true) {
    Notifications.add("Banned users cannot edit their profile", 0);
    return;
  }
  EditProfileModal.show();
});

$(accountPage).on("click", ".group.history .resultEditTagsButton", (e) => {
  const resultid = $(e.target).attr("data-result-id");
  const tags = $(e.target).attr("data-tags");
  EditResultTagsModal.show(
    resultid ?? "",
    JSON.parse(tags ?? "[]"),
    "accountPage"
  );
});

$(accountPage)
  .find("button.createFilterPresetBtn")
  .on("click", () => {
    AddFilterPresetModal.show();
  });
