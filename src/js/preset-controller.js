import * as Config from "./config";
import * as DB from "./db";
import * as Notifications from "./notifications";
import * as Settings from "./settings";

export function apply(id) {
  // console.log(DB.getSnapshot().presets);
  DB.getSnapshot().presets.forEach((preset) => {
    if (preset.id == id) {
      Config.apply(JSON.parse(JSON.stringify(preset.config)));
      Notifications.add("Preset applied", 1, 2);
      Config.saveToLocalStorage();
      Settings.update();
    }
  });
}
