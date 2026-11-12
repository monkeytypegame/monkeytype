import { createRoot } from "solid-js";
import { QueryClient } from "@tanstack/solid-query";
import {
  clearSessionCollections,
  refetchSessionCollections,
} from "../collections/utils/session-collection";
import { createEffectOn } from "../hooks/effects";
import { isAuthenticated } from "../states/core";

export const queryClient = new QueryClient();

createRoot(() =>
  createEffectOn(isAuthenticated, (isSignedIn) => {
    if (isSignedIn) {
      // Kick each collection's download for the new user (see
      // `registerSessionCollection`). No reset: a reset would race the
      // collections' own initial download and fetch twice.
      refetchSessionCollections();
    } else {
      // Drop every user query and session collection so the next user can't see
      // the previous one's data. The reset applies synchronously (inside the
      // batch) and runs first, so the `setQueryData([])` of each clear below
      // wins as the query's final state.
      void queryClient.resetQueries({ queryKey: ["user"] });
      clearSessionCollections(queryClient);
    }
  }),
);
