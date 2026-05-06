import { QueryClient } from "@tanstack/solid-query";
import { createEffectOn } from "../hooks/effects";
import { isAuthenticated } from "../states/core";

export const queryClient = new QueryClient();

createEffectOn(isAuthenticated, () => {
  //reset user related queries and collections whenever the state changes.
  //for legacy access we initialize some user-bound collections without a user being present (e.g. tags, presets).
  //to avoid empty collections after login, reset the queries on every state change not just logout
  void queryClient.resetQueries({ queryKey: ["user"] });
});
