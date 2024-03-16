import * as PbTablesModal from "../modals/pb-tables";
import * as EditProfileModal from "../modals/edit-profile";
import { getSnapshot } from "../db";
import { isAuthenticated } from "../firebase";
import * as Notifications from "../elements/notifications";

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
