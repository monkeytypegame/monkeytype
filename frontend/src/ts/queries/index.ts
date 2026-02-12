import { QueryClient } from "@tanstack/solid-query";
import { createEffectOn } from "../hooks/effects";
import { isLoggedIn } from "../signals/core";

export const queryClient = new QueryClient();
createEffectOn(isLoggedIn, (state) => {
  if (!state) {
    console.debug("QueryClient clear all user related queries.");
    void queryClient.resetQueries({ queryKey: ["user"] });
  }
});
