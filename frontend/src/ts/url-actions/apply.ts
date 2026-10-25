// Applies the url actions (action.ts) for the test route (router/routes.ts)

import { showErrorNotification } from "../states/notifications";
import { createErrorMessage } from "../utils/error";
import { readUrlAction, UrlAction } from "./action";
import { challengeAction } from "./actions/challenge";
import { customThemeAction } from "./actions/custom-theme";
import { discordTokenAction } from "./actions/discord-oauth";
import { testSettingsAction } from "./actions/test-settings";

/** The url as the test route sees it. */
type UrlParts = {
  search: Record<string, unknown>;
  /** the raw search, see getRawParams */
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
 * The params of a raw search (eg. "?a=1&b=2") or hash. Unlike
 * URLSearchParams it keeps "+": base64 and lz values use it, not as a space.
 */
function getRawParams(str: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const pair of str.replace(/^\?/, "").split("&")) {
    if (pair === "") continue;
    // split at the first "=" only: base64 values end in "=" padding
    const separator = pair.indexOf("=");
    const key = separator === -1 ? pair : pair.slice(0, separator);
    const raw = separator === -1 ? "" : pair.slice(separator + 1);
    params[key] = decodeURIComponent(raw);
  }
  return params;
}

function getActionParams(
  action: UrlAction,
  url: UrlParts,
): Record<string, string> {
  return getRawParams(action.in === "search" ? url.searchStr : url.hash);
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
  found: { action: UrlAction; params: Record<string, string> }[],
): Promise<void> {
  for (const { action, params } of found) {
    const read = readUrlAction(action, params);
    if (!read.success) {
      console.error(`Invalid url action ${action.param}: ${read.error}`);
      showErrorNotification(`Invalid ${action.param} url: ${read.error}`);
      continue;
    }

    try {
      await action.apply(read.data);
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
    const params = getActionParams(action, url);
    return Object.hasOwn(params, action.param) ? [{ action, params }] : [];
  });

  if (found.length === 0) return undefined;

  void applyInOrder(found);

  const { search, hash } = found.reduce(
    (rest, { action }) => dropAction(action, rest),
    url,
  );
  return { search, hash };
}
