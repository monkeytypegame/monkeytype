import { hashKey, type QueryKey } from "@tanstack/solid-query";
import { createRoot, createSignal, onCleanup } from "solid-js";
import { createEffectOn } from "../../hooks/effects";
import { queryClient } from "../../queries";
import { isAuthenticated } from "../../states/core";

type SessionLoadStatus = "pending" | "success" | "error";

/**
 * Tracks a user collection's download since the last sign in.
 *
 * A collection keeps its rows (and its ready status) after sign out: the
 * `["user"]` query reset on sign out only sets the query back to pending. So
 * on the next sign in the collection looks ready with the previous session's
 * rows until the new download lands. Gate reads on `isLoaded` instead.
 *
 * Starts the download on sign in, unless it already ran: once sign out reset
 * the query, nothing else starts it (its `enabled` isn't re-evaluated, and
 * the collection's sync only fetches on its first start).
 *
 * The status changes once the query settles, after the collection applied the
 * rows (the query notifies its observers, the collection among them, before
 * the cache listeners).
 */
export function trackLoadSinceSignIn(
  queryKey: QueryKey,
  refetch: () => Promise<unknown>,
): {
  /** The download since the last sign in succeeded. Reactive. */
  isLoaded: () => boolean;
  /** Resolves once the download since the last sign in succeeded or failed. */
  whenSettled: () => Promise<void>;
} {
  const queryHash = hashKey(queryKey);
  const [status, setStatus] = createSignal<SessionLoadStatus>("pending");

  const queryStatus = (): SessionLoadStatus => {
    const query = queryClient.getQueryCache().get(queryHash);
    if (query === undefined || query.state.status === "pending") {
      return "pending";
    }
    return query.state.status;
  };

  // a root so the effect is owned, it lives as long as the page
  createRoot(() =>
    createEffectOn(isAuthenticated, (signedIn) => {
      setStatus("pending");
      if (!signedIn) return;
      setStatus(queryStatus());
      // a collection whose sync hasn't started has nothing to refetch: its
      // first sync start downloads
      if (status() === "pending") void refetch();
      const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
        if (event.query.queryHash === queryHash) setStatus(queryStatus());
      });
      onCleanup(unsubscribe);
    }),
  );

  const whenSettled = async (): Promise<void> =>
    new Promise((resolve) => {
      createRoot((dispose) =>
        createEffectOn(status, (current) => {
          if (current === "pending") return;
          dispose();
          resolve();
        }),
      );
    });

  return { isLoaded: () => status() === "success", whenSettled };
}
