import { QueryClient } from "@tanstack/query-core";
import { createEffectOn } from "../hooks/effects";
import { isLoggedIn } from "../signals/core";

export const queryClient = new QueryClient();

createEffectOn(isLoggedIn, (state) => {
  if (!state) {
    console.debug("QueryClient invalidate all queries.");
    void queryClient.invalidateQueries();
  }
});
