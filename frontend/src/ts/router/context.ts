import type { QueryClient } from "@tanstack/solid-query";

/** What routes need to know about auth. The app's is in router/auth.ts. */
export type RouterAuth = {
  /** False when auth failed to load - guarded pages send users to the test page. */
  isAvailable: () => boolean;
  isSignedIn: () => boolean;
  /** Resolves once the first auth state is known. */
  waitForFirstState: () => Promise<void>;
  /**
   * The user data download of the last sign in, until it succeeded. After a
   * failed one it starts a new one (Retry). undefined if there's none.
   */
  userDataDownload: () => Promise<void> | undefined;
  /** Calls `listener` on every auth state change after the first. Returns an unsubscribe. */
  onChange: (listener: () => void) => () => void;
};

/** Router context: guards and loaders read these instead of module globals. */
export type RouterContext = {
  auth: RouterAuth;
  queryClient: QueryClient;
};
