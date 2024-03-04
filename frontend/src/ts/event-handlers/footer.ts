import Config, * as UpdateConfig from "../config";
import { isAuthenticated } from "../firebase";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";

async function getCommandline(): Promise<
  typeof import("../commandline/commandline")
> {
  return await import("../commandline/commandline");
}

document
  .querySelector("footer #commandLineButton")
  ?.addEventListener("click", async () => {
    (await getCommandline()).show({
      singleListOverride: false,
    });
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

export {};
