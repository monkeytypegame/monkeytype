import { QueryClient } from "@tanstack/solid-query";
import { createEffectOn } from "../hooks/effects";
import { isAuthenticated } from "../states/core";

export const queryClient = new QueryClient();

createEffectOn(isAuthenticated, (state) => {
  if (!state) {
    console.debug("QueryClient clear all user related queries.");
    void queryClient.resetQueries({ queryKey: ["user"] });
  }
});
