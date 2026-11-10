import { hashKey, type QueryKey } from "@tanstack/solid-query";
import { createRoot, createSignal, onCleanup } from "solid-js";
import { createEffectOn } from "../../hooks/effects";
import { queryClient } from "../../queries";
import { isAuthenticated } from "../../states/core";

/** `loading` also while signed out: there's no session to have loaded. */
export type SessionDownloadStatus = "loading" | "loaded" | "failed";

/**
 * A user collection's download in the current session (since the last sign
 * in).
 *
 * A collection keeps its rows (and its ready status) after sign out: the
 * `["user"]` query reset on sign out only sets the query back to pending. So
 * on the next sign in the collection looks ready with the previous session's
 * rows until the new download lands. Gate reads on `status()` instead.
 *
 * Starts the download on sign in, unless it already ran: once sign out reset
 * the query, nothing else starts it (its `enabled` isn't re-evaluated, and
 * the collection's sync only fetches on its first start).
 *
 * The status changes once the query settles, after the collection applied the
 * rows (the query notifies its observers, the collection among them, before
 * the cache listeners).
 */
export function createSessionDownload(
  queryKey: QueryKey,
  refetch: () => Promise<unknown>,
): {
  /** `failed` only after the query's retries. Reactive. */
  status: () => SessionDownloadStatus;
  /** Downloads again; `loading` until it settles. */
  reload: () => void;
  /** Resolves once the session's download loaded or failed. */
  whenSettled: () => Promise<void>;
} {
  const queryHash = hashKey(queryKey);
  const [status, setStatus] = createSignal<SessionDownloadStatus>("loading");

  const queryStatus = (): SessionDownloadStatus => {
    const query = queryClient.getQueryCache().get(queryHash);
    if (query === undefined || query.state.status === "pending") {
      return "loading";
    }
    if (query.state.status === "success") return "loaded";
    // a reload after a failure keeps the error status while it fetches
    return query.state.fetchStatus === "idle" ? "failed" : "loading";
  };

  // a root so the effect is owned, it lives as long as the page
  createRoot(() =>
    createEffectOn(isAuthenticated, (signedIn) => {
      setStatus("loading");
      if (!signedIn) return;
      setStatus(queryStatus());
      // a collection whose sync hasn't started has nothing to refetch: its
      // first sync start downloads
      if (status() === "loading") void refetch();
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
          if (current === "loading") return;
          dispose();
          resolve();
        }),
      );
    });

  const reload = (): void => {
    setStatus("loading");
    void refetch();
  };

  return { status, reload, whenSettled };
}
