import { z } from "zod";

import { getRouter } from "../router/instance";
import { navigate } from "../router/navigate";

/** The settings url search params, taking strings in. */
export const SettingsSearchSchema = z.object({
  /** the deep linked setting */
  highlight: z.string().optional().catch(undefined),
});

/**
 * Shows a deep link to the setting `key` in the url (without a history entry)
 * and returns it.
 */
export function linkToSetting(key: string): string {
  const location = { to: "/settings", search: { highlight: key } } as const;
  void navigate({ ...location, replace: true, resetScroll: false });
  const href = getRouter()?.buildLocation(location).href ?? "/settings";
  return window.location.origin + href;
}
