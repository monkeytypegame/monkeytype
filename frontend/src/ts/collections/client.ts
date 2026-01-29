import { QueryClient } from "@tanstack/query-core";
import { createEffectOn } from "../hooks/effects";
import { isLoggedIn } from "../signals/core";

export const queryClient = new QueryClient();

createEffectOn(isLoggedIn, (state) => {
  if (!state) {
    console.debug("QueryClient clear.");
    queryClient.clear();
  }
});
