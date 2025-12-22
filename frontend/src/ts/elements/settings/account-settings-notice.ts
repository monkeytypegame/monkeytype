import { z } from "zod";
import { LocalStorageWithSchema } from "../../utils/local-storage-with-schema";
import { navigate } from "../../controllers/route-controller";

const ls = new LocalStorageWithSchema({
  key: "accountSettingsMessageDismissed",
  schema: z.boolean(),
  fallback: false,
});

const noticeSelector = ".pageSettings .accountSettingsNotice";

if (ls.get()) {
  document.querySelector(noticeSelector)?.remove();
}

document
  .querySelector(`${noticeSelector} .dismissAndGo`)
  ?.addEventListener("click", () => {
    ls.set(true);
    void navigate("/account-settings");
    document.querySelector(noticeSelector)?.remove();
  });
