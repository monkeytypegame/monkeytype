import { z } from "zod";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
// import * as Notifications from "./notifications";

const closed = new LocalStorageWithSchema({
  key: "merchBannerClosed",
  schema: z.boolean(),
  fallback: false,
});

export function showIfNotClosedBefore(): void {
  if (!closed.get()) {
    // Notifications.addBanner(
    //   `Check out our merchandise, available at <a target="_blank" rel="noopener" href="https://monkeytype.store/">monkeytype.store</a>`,
    //   1,
    //   "./images/merch2.png",
    //   false,
    //   () => {
    //     closed.set(true);
    //   },
    //   true
    // );
  }
}
