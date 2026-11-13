import { createRoot } from "solid-js";
import { QueryClient } from "@tanstack/solid-query";
import {
  signInSession,
  signOutSession,
} from "../collections/utils/session-collection";
import { createEffectOn } from "../hooks/effects";
import { isAuthenticated } from "../states/core";

export const queryClient = new QueryClient();

createRoot(() =>
  createEffectOn(isAuthenticated, (isSignedIn) => {
    if (isSignedIn) {
      // Download each session collection for the new user. No reset: the
      // plain user queries fetch on their own once enabled.
      signInSession();
    } else {
      // Drop every user query and session collection so the next user can't
      // see the previous one's data (see `createSessionCollection`).
      void signOutSession(queryClient);
    }
  }),
);
