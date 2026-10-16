import type { RegisteredRouter } from "@tanstack/solid-router";

import { getRouter } from "./instance";

/**
 * Typed navigation to internal routes: `navigate({ to, params, search })`.
 * External links use plain urls instead.
 * Navigation guards live in the router's history blocker (router/create-router.ts).
 */
export const navigate: RegisteredRouter["navigate"] = async (options) => {
  const router = getRouter();
  if (router === undefined) {
    console.error("navigate ignored, router not initialised", options);
    return;
  }
  await router.navigate(options);
};
