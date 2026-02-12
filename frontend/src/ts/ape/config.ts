import { Config } from "@monkeytype/schemas/configs";
import { isAuthenticated } from "../firebase";
import * as Notifications from "../elements/notifications";
import Ape from ".";

export async function saveConfig(config: Partial<Config>): Promise<void> {
  if (isAuthenticated()) {
    const response = await Ape.configs.save({ body: config });
    if (response.status !== 200) {
      Notifications.add("Failed to save config", -1, { response });
    }
  }
}
export async function deleteConfig(): Promise<void> {
  if (isAuthenticated()) {
    const response = await Ape.configs.delete();
    if (response.status !== 200) {
      Notifications.add("Failed to reset config", -1, { response });
    }
  }
}
