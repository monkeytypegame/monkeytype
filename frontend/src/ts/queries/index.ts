import { createRoot } from "solid-js";
import { QueryClient } from "@tanstack/solid-query";
import { createEffectOn } from "../hooks/effects";
import { isAuthenticated } from "../states/core";

export const queryClient = new QueryClient();

createRoot(() =>
  createEffectOn(
    isAuthenticated,
    (isSignedIn) => {
      // On sign out, drop every user-scoped query/collection so the next user
      // can't see the previous one's data.
      //
      // Do NOT reset on sign in. Each collection already starts its own initial
      // download once authenticated: live queries fetch on first subscribe, and
      // the rest (presets, tags) are awaited via waitFor...Ready in the login
      // flow. A reset here would race that download and fetch a second time
      // (the duplicate connections fetch on the test page).
      if (!isSignedIn) {
        void queryClient.resetQueries({ queryKey: ["user"] });
      }
    },
    { defer: true },
  ),
);
