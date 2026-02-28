import { showLoaderBar, hideLoaderBar } from "../signals/loader-bar";
import * as Notifications from "../elements/notifications";
import { createErrorMessage } from "./misc";
import * as Skeleton from "../utils/skeleton";

Skeleton.save("devOptionsModal");

export async function getDevOptionsModal(): Promise<
  typeof import("../modals/dev-options.js")
> {
  try {
    showLoaderBar();
    const module = await import("../modals/dev-options.js");
    hideLoaderBar();
    return module;
  } catch (e) {
    hideLoaderBar();
    if (
      e instanceof Error &&
      e.message.includes("Failed to fetch dynamically imported module")
    ) {
      Notifications.add(
        "Failed to load dev options module: could not fetch",
        -1,
      );
    } else {
      const msg = createErrorMessage(e, "Failed to load dev options module");
      Notifications.add(msg, -1);
    }
    throw e;
  }
}
