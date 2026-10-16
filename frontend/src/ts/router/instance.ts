import type { RegisteredRouter } from "@tanstack/solid-router";
import { createSignal } from "solid-js";

// the app's router, set by router/app-router.ts - kept separate so vanilla
// modules can navigate and read router state without importing the route
// tree. router.state is reactive (backed by solid signals)
export const [getRouter, setRouter] = createSignal<RegisteredRouter>();
