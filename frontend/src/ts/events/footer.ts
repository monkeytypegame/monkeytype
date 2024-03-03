import * as Commandline from "../commandline/commandline";
import Config, * as UpdateConfig from "../config";
import { isAuthenticated } from "../firebase";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";

document
  .querySelector("footer #commandLineButton")
  ?.addEventListener("click", () => {
    Commandline.show({
      singleListOverride: false,
    });
  });

document
  .querySelector("footer .right .current-theme")
  ?.addEventListener("click", (event) => {
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
