import { z } from "zod";
import { LocalStorageWithSchema } from "../../utils/local-storage-with-schema";
import { navigate } from "../../controllers/route-controller";

const ls = new LocalStorageWithSchema({
  key: "accountSettingsMessageDismissed",
  schema: z.boolean(),
  fallback: false,
});

if (ls.get()) {
  $(".pageSettings .accountSettingsNotice").remove();
}

$(".pageSettings .accountSettingsNotice .dismissAndGo").on("click", () => {
  ls.set(true);
  navigate("/account-settings");
  $(".pageSettings .accountSettingsNotice").remove();
});
