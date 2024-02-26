import * as Commandline from "../commandline/commandline";
import * as CommandlineLists from "../commandline/lists";
import Config, * as UpdateConfig from "../config";
import { isAuthenticated } from "../firebase";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";

document
  .querySelector("footer #commandLineButton")
  ?.addEventListener("click", () => {
    Commandline.show({
      subgroupOverride: CommandlineLists.commands,
    });
  });

document
  .querySelector("footer .right .current-theme")
  ?.addEventListener("click", (event) => {
    const e = event as MouseEvent;
    if (e.shiftKey) {
      if (!Config.customTheme) {
        if (isAuthenticated()) {
          if ((DB.getSnapshot()?.customThemes?.length ?? 0) < 1) {
            Notifications.add("No custom themes!", 0);
            UpdateConfig.setCustomTheme(false);
            return;
          }
        }
        UpdateConfig.setCustomTheme(true);
      } else UpdateConfig.setCustomTheme(false);
    } else {
      const subgroup = Config.customTheme
        ? CommandlineLists.getList("customThemesList")
        : CommandlineLists.getList("themes");
      Commandline.show({
        subgroupOverride: subgroup,
      });
    }
  });
