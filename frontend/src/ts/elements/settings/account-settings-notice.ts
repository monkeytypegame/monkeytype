import { z } from "zod";
import { LocalStorageWithSchema } from "../../utils/local-storage-with-schema";
import { navigate } from "../../controllers/route-controller";
import { qsa } from "../../utils/dom";

const ls = new LocalStorageWithSchema({
  key: "accountSettingsMessageDismissed",
  schema: z.boolean(),
  fallback: false,
});

if (ls.get()) {
  qsa(".pageSettings .accountSettingsNotice")?.remove();
}

qsa(".pageSettings .accountSettingsNotice .dismissAndGo").on("click", () => {
  ls.set(true);
  void navigate("/account-settings");
  qsa(".pageSettings .accountSettingsNotice")?.remove();
});
