import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import { createErrorMessage } from "./misc";
import * as Skeleton from "../utils/skeleton";

Skeleton.save("commandLine");

export async function getCommandline(): Promise<
  typeof import("../commandline/commandline.js")
> {
  try {
    Loader.show();
    // eslint-disable-next-line import/no-unresolved
    const module = await import("../commandline/commandline.js");
    Loader.hide();
    return module;
  } catch (e) {
    Loader.hide();
    if (
      e instanceof Error &&
      e.message.includes("Failed to fetch dynamically imported module")
    ) {
      Notifications.add(
        "Failed to load commandline module: could not fetch",
        -1
      );
    } else {
      const msg = createErrorMessage(e, "Failed to load commandline module");
      Notifications.add(msg, -1);
    }
    throw e;
  }
}

Skeleton.save("devOptionsModal");

export async function getDevOptionsModal(): Promise<
  typeof import("../modals/dev-options.js")
> {
  try {
    Loader.show();
    // eslint-disable-next-line import/no-unresolved
    const module = await import("../modals/dev-options.js");
    Loader.hide();
    return module;
  } catch (e) {
    Loader.hide();
    if (
      e instanceof Error &&
      e.message.includes("Failed to fetch dynamically imported module")
    ) {
      Notifications.add(
        "Failed to load dev options module: could not fetch",
        -1
      );
    } else {
      const msg = createErrorMessage(e, "Failed to load dev options module");
      Notifications.add(msg, -1);
    }
    throw e;
  }
}
