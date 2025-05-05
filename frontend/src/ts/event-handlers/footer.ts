import Config, * as UpdateConfig from "../config";
import { isAuthenticated } from "../firebase";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as Commandline from "../commandline/commandline";
import * as SupportPopup from "../modals/support";
import * as ContactModal from "../modals/contact";
import * as VersionHistoryModal from "../modals/version-history";
import { envConfig } from "../constants/env-config";
import { COMPATIBILITY_CHECK } from "@monkeytype/contracts";
import { lastSeenServerCompatibility } from "../ape/adapters/ts-rest-adapter";

document
  .querySelector("footer #commandLineMobileButton")
  ?.addEventListener("click", async () => {
    Commandline.show({
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
      alert(
        JSON.stringify(
          {
            clientVersion: envConfig.clientVersion,
            clientCompatibility: COMPATIBILITY_CHECK,
            lastSeenServerCompatibility,
          },
          null,
          2
        )
      );
    } else {
      VersionHistoryModal.show();
    }
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
      Commandline.show({
        subgroupOverride: subgroup,
      });
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
