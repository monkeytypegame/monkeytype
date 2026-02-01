import { QueryClient } from "@tanstack/query-core";
import { createEffectOn } from "../hooks/effects";
import { isLoggedIn } from "../signals/core";
import { addToGlobal } from "../utils/misc";

export const queryClient = new QueryClient();

addToGlobal({ queryClient });
createEffectOn(isLoggedIn, (state) => {
  if (!state) {
    console.debug("QueryClient clear all user related queries.");
    void queryClient.resetQueries({ queryKey: ["user"] });
  }
});
