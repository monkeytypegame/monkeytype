// Applies the url actions (action.ts) for the test route (router/routes.ts)

import { showErrorNotification } from "../states/notifications";
import { createErrorMessage } from "../utils/error";
import { UrlAction } from "./action";
import { challengeAction } from "./actions/challenge";
import { customThemeAction } from "./actions/custom-theme";
import { discordTokenAction } from "./actions/discord-oauth";
import { testSettingsAction } from "./actions/test-settings";

/** The url as the test route sees it. */
type UrlParts = {
  search: Record<string, unknown>;
  /** the raw search, see getRawParam */
  searchStr: string;
  hash: string;
};

// applied in order, each once the one before it is done: a challenge
// overrides test settings
const URL_ACTIONS: UrlAction[] = [
  customThemeAction,
  testSettingsAction,
  challengeAction,
  discordTokenAction,
];

/**
 * The value of `param` in a raw search (eg. "?a=1&b=2") or hash, or null.
 * Unlike URLSearchParams it keeps "+": base64 and lz values use it, not as a
 * space.
 */
function getRawParam(str: string, param: string): string | null {
  let value: string | null = null;
  for (const pair of str.replace(/^\?/, "").split("&")) {
    // split at the first "=" only: base64 values end in "=" padding
    const separator = pair.indexOf("=");
    const key = separator === -1 ? pair : pair.slice(0, separator);
    const raw = separator === -1 ? "" : pair.slice(separator + 1);
    if (key === param) value = decodeURIComponent(raw);
  }
  return value;
}

function getParamReader(
  action: UrlAction,
  url: UrlParts,
): (param: string) => string | null {
  const str = action.in === "search" ? url.searchStr : url.hash;
  return (param) => getRawParam(str, param);
}

function dropAction(action: UrlAction, url: UrlParts): UrlParts {
  if (action.in === "hash") return { ...url, hash: "" };
  return {
    ...url,
    search: Object.fromEntries(
      Object.entries(url.search).filter(([key]) => key !== action.param),
    ),
  };
}

async function applyInOrder(
  found: { action: UrlAction; value: string }[],
  url: UrlParts,
): Promise<void> {
  for (const { action, value } of found) {
    try {
      await action.apply(value, getParamReader(action, url));
    } catch (e) {
      console.error(`Failed to apply url action ${action.param}`, e);
      showErrorNotification(createErrorMessage(e, action.failure));
    }
  }
}

/**
 * Starts applying the url's actions (URL_ACTIONS). Returns the url's search
 * and hash without them, or undefined if there was nothing to apply.
 */
export function applyUrlActions(
  url: UrlParts,
): Omit<UrlParts, "searchStr"> | undefined {
  const found = URL_ACTIONS.flatMap((action) => {
    const value = getParamReader(action, url)(action.param);
    return value === null ? [] : [{ action, value }];
  });

  if (found.length === 0) return undefined;

  void applyInOrder(found, url);

  const { search, hash } = found.reduce(
    (rest, { action }) => dropAction(action, rest),
    url,
  );
  return { search, hash };
}
