import { Config } from "@monkeytype/schemas/configs";
import { isAuthenticated } from "../firebase";
import { notifyError } from "../stores/notifications";
import Ape from ".";

export async function saveConfig(config: Partial<Config>): Promise<void> {
  if (isAuthenticated()) {
    const response = await Ape.configs.save({ body: config });
    if (response.status !== 200) {
      notifyError("Failed to save config", { response });
    }
  }
}
export async function deleteConfig(): Promise<void> {
  if (isAuthenticated()) {
    const response = await Ape.configs.delete();
    if (response.status !== 200) {
      notifyError("Failed to reset config", { response });
    }
  }
}
