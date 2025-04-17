import Config, * as UpdateConfig from "../config";
import { isAuthenticated } from "../firebase";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import { getCommandline } from "../utils/async-modules";
import * as SupportPopup from "../modals/support";
import * as ContactModal from "../modals/contact";
import * as VersionHistoryModal from "../modals/version-history";
import { envConfig } from "../constants/env-config";
import * as ThemeController from "../controllers/theme-controller";
import * as ConfigEvent from "../observables/config-event";

document
  .querySelector("footer #commandLineMobileButton")
  ?.addEventListener("click", async () => {
    (await getCommandline()).show({
      singleListOverride: false,
    });
  });

document
  .querySelector("footer #newVersionIndicator")
  ?.addEventListener("click", (e) => {
    e.stopPropagation();
    document.querySelector("#newVersionIndicator")?.classList.add("hidden");
  });

document
  .querySelector("footer .currentVersion")
  ?.addEventListener("click", (e) => {
    const event = e as MouseEvent;
    if (event.shiftKey) {
      alert(envConfig.clientVersion);
    } else {
      VersionHistoryModal.show();
    }
  });

// update the favorite icon in the current theme button
function updateCurrentThemeFavIcon(): void {
  const favIconEl = document.querySelector(
    "footer .right .current-theme .favIcon"
  );
  if (!favIconEl) return;
  const currentTheme = Config.customTheme
    ? "custom"
    : ThemeController.randomTheme ?? Config.theme;
  if (!Config.customTheme && Config.favThemes.includes(currentTheme)) {
    favIconEl.innerHTML = '<i class="fas fa-heart"></i>';
    favIconEl.classList.add("active");
  } else {
    favIconEl.innerHTML = '<i class="far fa-heart"></i>';
    favIconEl.classList.remove("active");
  }
}

// add favorite icon to the current theme button
const currentThemeButton = document.querySelector(
  "footer .right .current-theme"
);
if (currentThemeButton) {
  const favIconDiv = document.createElement("div");
  favIconDiv.className = "favIcon";
  favIconDiv.innerHTML = '<i class="far fa-heart"></i>';
  currentThemeButton.appendChild(favIconDiv);
  updateCurrentThemeFavIcon();
}
document
  .querySelector("footer .right .current-theme .favIcon")
  ?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (Config.customTheme) {
      Notifications.add("Cannot favorite custom themes", 0);
      return;
    }
    const currentTheme = ThemeController.randomTheme ?? Config.theme;
    if (Config.favThemes.includes(currentTheme)) {
      // remove from favorites
      UpdateConfig.setFavThemes(
        Config.favThemes.filter((t) => t !== currentTheme)
      );
      Notifications.add("Removed from favorites", 1);
    } else {
      // add
      UpdateConfig.setFavThemes([...Config.favThemes, currentTheme]);
      Notifications.add("Added to favorites", 1);
    }

    updateCurrentThemeFavIcon();
  });

document
  .querySelector("footer .right .current-theme")
  ?.addEventListener("click", async (event) => {
    const e = event as MouseEvent;
    if (e.shiftKey) {
      if (Config.customTheme) {
        UpdateConfig.setCustomTheme(false);
        return;
      }
      if (
        isAuthenticated() &&
        (DB.getSnapshot()?.customThemes?.length ?? 0) < 1
      ) {
        Notifications.add("No custom themes!", 0);
        UpdateConfig.setCustomTheme(false);
        return;
      }
      UpdateConfig.setCustomTheme(true);
    } else {
      const subgroup = Config.customTheme ? "customThemesList" : "themes";
      (await getCommandline()).show({
        subgroupOverride: subgroup,
      });
    }
  });

// subscribe to theme-related config events to update the favorite icon
ConfigEvent.subscribe((eventKey, _eventValue) => {
  if (["theme", "customTheme", "favThemes"].includes(eventKey)) {
    updateCurrentThemeFavIcon();
  }
});

document
  .querySelector("footer #supportMeButton")
  ?.addEventListener("click", () => {
    SupportPopup.show();
  });

document
  .querySelector("footer #contactPopupButton")
  ?.addEventListener("click", () => {
    ContactModal.show();
  });
