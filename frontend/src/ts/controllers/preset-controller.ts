import * as UpdateConfig from "../config";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as TestLogic from "../test/test-logic";
import * as TagController from "./tag-controller";

export function apply(_id: string): void {
  // console.log(DB.getSnapshot().presets);
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;
  if (snapshot.presets) {for (const preset of snapshot.presets) {
    if (preset._id == _id) {
      UpdateConfig.apply(preset.config);
      TagController.clear(true);
      if (preset.config.tags) {
        for (const tagid of preset.config.tags) {
          TagController.set(tagid, true, false);
        }
        TagController.saveActiveToLocalStorage();
      }
      TestLogic.restart();
      Notifications.add("Preset applied", 1, 2);
      UpdateConfig.saveFullConfigToLocalStorage();
    }
  }}
}
