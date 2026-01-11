import Config, { setConfig } from "../config";
import { isAuthenticated } from "../firebase";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as Commandline from "../commandline/commandline";
import * as SupportPopup from "../modals/support";
import * as ContactModal from "../modals/contact";
import { qs } from "../utils/dom";

qs("footer #commandLineMobileButton")?.on("click", async () => {
  Commandline.show({
    singleListOverride: false,
  });
});

qs("footer .right .current-theme")?.on("click", async (event) => {
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
});

qs("footer #supportMeButton")?.on("click", () => {
  SupportPopup.show();
});

qs("footer #contactPopupButton")?.on("click", () => {
  ContactModal.show();
});
