import type { RegisteredRouter } from "@tanstack/solid-router";
import { createSignal } from "solid-js";

// set by router/index.ts - kept separate so vanilla modules can navigate and
// read router state without importing the route tree. router.state is
// reactive (backed by solid signals)
export const [getRouter, setRouter] = createSignal<RegisteredRouter>();

/**
 * Typed navigation to internal routes: `navigate({ to, params, search })`.
 * External links use plain urls instead.
 * Navigation guards live in the router's history blocker (router/index.ts).
 */
export const navigate: RegisteredRouter["navigate"] = async (options) => {
  const router = getRouter();
  if (router === undefined) {
    console.error("navigate ignored, router not initialised", options);
    return;
  }
  await router.navigate(options);
};
