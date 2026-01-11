import Config, { setConfig } from "../config";
import { isAuthenticated } from "../firebase";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as Commandline from "../commandline/commandline";
import { qs } from "../utils/dom";

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
