import { createRoot } from "solid-js";
import { QueryClient } from "@tanstack/solid-query";
import { createEffectOn } from "../hooks/effects";
import { isAuthenticated } from "../states/core";

export const queryClient = new QueryClient();

createRoot(() =>
  createEffectOn(isAuthenticated, (isSignedIn) => {
    // On sign out, drop every user-scoped query/collection so the next user
    // can't see the previous one's data.
    //
    // Do NOT reset on sign in. Each collection already starts its own
    // initial download once authenticated: live queries fetch on first
    // subscribe, the session queries (user, tags, presets) are downloaded by
    // the login flow, and the startSync'd ones (filter presets, custom themes)
    // refetch themselves on sign in. A reset here would race that download
    // and fetch a second time (the duplicate connections fetch on the test
    // page).
    if (!isSignedIn) {
      void queryClient.resetQueries({ queryKey: ["user"] });
    }
  }),
);
