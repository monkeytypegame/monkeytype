import { createSignal } from "solid-js";

import { getVisiblePage } from "./router";
import { isTestFadedOut } from "./test";

/**
 * Ads stay hidden while the test page shows a test: from the moment the page
 * has faded in until it has faded out again (navigating), except once the
 * test has faded out on finish (spinner, result).
 */
export function isTestPageHidingAds(): boolean {
  return getVisiblePage() === "test" && !isTestFadedOut();
}

// undefined until the ad controller checks
export const [getAdBlock, setAdBlock] = createSignal<boolean | undefined>();
export const [getCookieBlocker, setCookieBlocker] = createSignal<
  boolean | undefined
>();
