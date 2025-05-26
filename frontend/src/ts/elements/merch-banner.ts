import { z } from "zod";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import * as Notifications from "./notifications";

const closed = new LocalStorageWithSchema({
  key: "merchBannerClosed3",
  schema: z.boolean(),
  fallback: false,
});

export function showIfNotClosedBefore(): void {
  if (!closed.get()) {
    Notifications.addBanner(
      `New merch store now open, including a limited edition metal keycap! <a target="_blank" rel="noopener" href="https://mktp.co/merch">monkeytype.store</a>`,
      1,
      "./images/merch3.png",
      false,
      () => {
        closed.set(true);
      },
      true
    );
  }
}
