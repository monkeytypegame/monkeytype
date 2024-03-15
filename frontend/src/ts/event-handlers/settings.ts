import * as ShareCustomThemeModal from "../modals/share-custom-theme";
import * as CookiesModal from "../modals/cookies";
import * as StreakHourOffsetModal from "../modals/streak-hour-offset";
import * as EditPresetPopup from "../modals/edit-preset";

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
  ?.querySelector("#setStreakHourOffset")
  ?.addEventListener("click", () => {
    StreakHourOffsetModal.show();
  });

settingsPage
  ?.querySelector(".section.presets")
  ?.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("addPresetButton")) {
      EditPresetPopup.show("add");
    } else if (target.classList.contains("editButton")) {
      const presetid = target.parentElement?.getAttribute("data-id");
      const name = target.parentElement?.getAttribute("data-name");
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
      const name = target.parentElement?.getAttribute("data-name");
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
