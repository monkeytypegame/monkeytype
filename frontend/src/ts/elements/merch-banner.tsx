import { z } from "zod";

import { addBanner } from "../states/banners";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

const closed = new LocalStorageWithSchema({
  key: "merchBannerClosed3",
  schema: z.boolean(),
  fallback: false,
});

export function showIfNotClosedBefore(): void {
  if (!closed.get()) {
    addBanner({
      level: "success",
      icon: "fas fa-fw fa-shopping-bag",
      customContent: (
        <>
          Check out our merch store!{" "}
          <a target="_blank" rel="noopener" href="https://mktp.co/merch">
            monkeytype.store
          </a>
        </>
      ),
      imagePath: "/images/merch2.png",
      onClose: () => {
        closed.set(true);
      },
    });
  }
}
