import { z } from "zod";
import { LocalStorageWithSchema } from "../../utils/local-storage-with-schema";
import { navigate } from "../../controllers/route-controller";
import { qs } from "../../utils/dom";

const ls = new LocalStorageWithSchema({
  key: "accountSettingsMessageDismissed",
  schema: z.boolean(),
  fallback: false,
});

if (ls.get()) {
  qs(".pageSettings .accountSettingsNotice")?.remove();
}

qs(".pageSettings .accountSettingsNotice .dismissAndGo")?.on("click", () => {
  ls.set(true);
  void navigate("/account-settings");
  qs(".pageSettings .accountSettingsNotice")?.remove();
});
