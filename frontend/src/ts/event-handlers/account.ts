import * as PbTablesModal from "../modals/pb-tables";
import * as EditProfileModal from "../modals/edit-profile";
import { getSnapshot } from "../db";
import { isAuthenticated } from "../firebase";
import * as Notifications from "../elements/notifications";
import * as EditResultTagsModal from "../modals/edit-result-tags";
import * as AddFilterPresetModal from "../modals/new-filter-preset";
import { parseWithSchema as parseJsonWithSchema } from "@monkeytype/util/json";
import { z } from "zod";
import { qs } from "../utils/dom";

const accountPage = qs("#pageAccount");

accountPage?.onChild("click", ".pbsTime .showAllButton", () => {
  PbTablesModal.show("time");
});

accountPage?.onChild("click", ".pbsWords .showAllButton", () => {
  PbTablesModal.show("words");
});

accountPage?.onChild("click", ".editProfileButton", () => {
  if (!isAuthenticated()) {
    Notifications.add("You must be logged in to edit your profile", 0);
    return;
  }
  const snapshot = getSnapshot();
  if (!snapshot) {
    Notifications.add(
      "Failed to open edit profile modal: No user snapshot found",
      -1,
    );
    return;
  }
  if (snapshot.banned === true) {
    Notifications.add("Banned users cannot edit their profile", 0);
    return;
  }
  EditProfileModal.show();
});

const TagsArraySchema = z.array(z.string());

accountPage?.onChild("click", ".group.history .resultEditTagsButton", (e) => {
  const targetButton = e.childTarget as HTMLElement;
  const resultid = targetButton?.getAttribute("data-result-id");
  const tags = targetButton?.getAttribute("data-tags");

  EditResultTagsModal.show(
    resultid ?? "",
    parseJsonWithSchema(tags ?? "[]", TagsArraySchema),
    "accountPage",
  );
});

accountPage?.qs("button.createFilterPresetBtn")?.on("click", () => {
  AddFilterPresetModal.show();
});
