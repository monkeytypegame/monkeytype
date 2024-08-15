import * as UpdateConfig from "../config";
import * as DB from "../db";
import * as Notifications from "../elements/notifications";
import * as TestLogic from "../test/test-logic";
import { migrateConfig } from "../utils/config";
import * as TagController from "./tag-controller";

export async function apply(_id: string): Promise<void> {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;

  const presetToApply = snapshot.presets?.find((preset) => preset._id === _id);

  if (presetToApply === undefined) {
    Notifications.add("Preset not found", 0);
    return;
  }

  await UpdateConfig.apply(migrateConfig(presetToApply.config));
  TagController.clear(true);
  if (presetToApply.config.tags) {
    for (const tagId of presetToApply.config.tags) {
      TagController.set(tagId, true, false);
    }
    TagController.saveActiveToLocalStorage();
  }
  TestLogic.restart();
  Notifications.add("Preset applied", 1, {
    duration: 2,
  });
  UpdateConfig.saveFullConfigToLocalStorage();
}
