import * as ShareCustomThemeModal from "../modals/share-custom-theme";
import * as CookiesModal from "../modals/cookies";
import * as EditPresetPopup from "../modals/edit-preset";
import * as EditTagPopup from "../modals/edit-tag";

import * as Notifications from "../elements/notifications";

const settingsPage = document.querySelector("#pageSettings");

settingsPage
  ?.querySelector("#shareCustomThemeButton")
  ?.addEventListener("click", () => {
    ShareCustomThemeModal.show();
  });

settingsPage
  ?.querySelector(".section.updateCookiePreferences button")
  ?.addEventListener("click", () => {
    CookiesModal.show(true);
  });

settingsPage
  ?.querySelector(".section.presets")
  ?.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("addPresetButton")) {
      EditPresetPopup.show("add");
    } else if (target.classList.contains("editButton")) {
      const presetid = target.parentElement?.getAttribute("data-id");
      const name = target.parentElement?.getAttribute("data-display");
      if (
        presetid === undefined ||
        name === undefined ||
        presetid === "" ||
        name === "" ||
        presetid === null ||
        name === null
      ) {
        Notifications.add(
          "Failed to edit preset: Could not find preset id or name",
          -1
        );
        return;
      }
      EditPresetPopup.show("edit", presetid, name);
    } else if (target.classList.contains("removeButton")) {
      const presetid = target.parentElement?.getAttribute("data-id");
      const name = target.parentElement?.getAttribute("data-display");
      if (
        presetid === undefined ||
        name === undefined ||
        presetid === "" ||
        name === "" ||
        presetid === null ||
        name === null
      ) {
        Notifications.add(
          "Failed to remove preset: Could not find preset id or name",
          -1
        );
        return;
      }
      EditPresetPopup.show("remove", presetid, name);
    }
  });

settingsPage?.querySelector(".section.tags")?.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains("addTagButton")) {
    EditTagPopup.show("add");
  } else if (target.classList.contains("editButton")) {
    const tagid = target.parentElement?.getAttribute("data-id");
    const name = target.parentElement?.getAttribute("data-display");
    if (
      tagid === undefined ||
      name === undefined ||
      tagid === "" ||
      name === "" ||
      tagid === null ||
      name === null
    ) {
      Notifications.add(
        "Failed to edit tag: Could not find tag id or name",
        -1
      );
      return;
    }
    EditTagPopup.show("edit", tagid, name);
  } else if (target.classList.contains("clearPbButton")) {
    const tagid = target.parentElement?.getAttribute("data-id");
    const name = target.parentElement?.getAttribute("data-display");
    if (
      tagid === undefined ||
      name === undefined ||
      tagid === "" ||
      name === "" ||
      tagid === null ||
      name === null
    ) {
      Notifications.add(
        "Failed to clear tag PB: Could not find tag id or name",
        -1
      );
      return;
    }
    EditTagPopup.show("clearPb", tagid, name);
  } else if (target.classList.contains("removeButton")) {
    const tagid = target.parentElement?.getAttribute("data-id");
    const name = target.parentElement?.getAttribute("data-display");
    if (
      tagid === undefined ||
      name === undefined ||
      tagid === "" ||
      name === "" ||
      tagid === null ||
      name === null
    ) {
      Notifications.add(
        "Failed to remove tag: Could not find tag id or name",
        -1
      );
      return;
    }
    EditTagPopup.show("remove", tagid, name);
  }
});
