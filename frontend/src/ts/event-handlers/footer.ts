import Config, { setConfig } from "../config";
import { isAuthenticated } from "../firebase";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as Commandline from "../commandline/commandline";
import * as SupportPopup from "../modals/support";
import * as ContactModal from "../modals/contact";
import * as VersionHistoryModal from "../modals/version-history";
import { envConfig } from "virtual:env-config";
import { COMPATIBILITY_CHECK } from "@monkeytype/contracts";
import { lastSeenServerCompatibility } from "../ape/adapters/ts-rest-adapter";
import { qs } from "../utils/dom";

qs("footer #commandLineMobileButton")?.on("click", async () => {
  Commandline.show({
    singleListOverride: false,
  });
});

qs("footer #newVersionIndicator")?.on("click", (e) => {
  e.stopPropagation();
  qs("#newVersionIndicator")?.hide();
});

qs("footer .currentVersion")?.on("click", (e) => {
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
        2,
      ),
    );
  } else {
    VersionHistoryModal.show();
  }
});

qs("footer .right .current-theme")
  ?.addEventListener("click", async (event) => {
    const e = event as MouseEvent;
    if (e.shiftKey) {
      if (Config.customTheme) {
        setConfig("customTheme", false);
        return;
      }
      if (
        isAuthenticated() &&
        (DB.getSnapshot()?.customThemes?.length ?? 0) < 1
      ) {
        Notifications.add("No custom themes!", 0);
        setConfig("customTheme", false);
        return;
      }
      setConfig("customTheme", true);
    } else {
      const subgroup = Config.customTheme ? "customTheme" : "themes";
      Commandline.show({
        subgroupOverride: subgroup,
      });
    }
    if (
      isAuthenticated() &&
      (DB.getSnapshot()?.customThemes?.length ?? 0) < 1
    ) {
      Notifications.add("No custom themes!", 0);
      setConfig("customTheme", false);
      return;
    }
    setConfig("customTheme", true);
  } else {
    const subgroup = Config.customTheme ? "customThemesList" : "themes";
    Commandline.show({
      subgroupOverride: subgroup,
    });
  }
});

qs("footer #supportMeButton")?.on("click", () => {
  SupportPopup.show();
});

qs("footer #contactPopupButton")?.on("click", () => {
  ContactModal.show();
});
