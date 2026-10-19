import { z } from "zod";
import { serialize } from "zod-urlsearchparams";

/** The setting deep linked with `?highlight=`, read from the url (not tracked). */
export function getHighlightedSetting(): string | undefined {
  return (
    new URLSearchParams(window.location.search).get("highlight") ?? undefined
  );
}

/**
 * Shows a deep link to the setting `key` in the url (without a history entry)
 * and returns it.
 */
export function linkToSetting(key: string): string {
  const urlParams = serialize({
    schema: z.object({ highlight: z.string() }),
    data: { highlight: key },
  });
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}?${urlParams.toString()}`,
  );
  return window.location.toString();
}
