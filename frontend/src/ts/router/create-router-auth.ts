// The router's view of auth: the first auth state, change listeners and the
// user data download of the last sign in. No side effects, so tests drive
// the real thing - the app feeds it auth events (router/app-router.ts)

import { promiseWithResolvers } from "../utils/misc";

/** What routes need to know about auth. Made by createRouterAuth. */
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

/** A sign in's user data download; `redownload` starts a new one. */
export type UserDataDownload = {
  download: Promise<void>;
  redownload: () => Promise<void>;
};

export type RouterAuthSource = RouterAuth & {
  /**
   * A new auth state: the first resolves waitForFirstState, later ones notify
   * the listeners. `userData`: the sign in's download, undefined when there's
   * nothing to wait for (eg. signed out).
   */
  stateChanged: (userData?: UserDataDownload) => void;
};

export function createRouterAuth(options: {
  isAvailable: () => boolean;
  isSignedIn: () => boolean;
}): RouterAuthSource {
  const { promise: firstState, resolve: resolveFirstState } =
    promiseWithResolvers();
  let isFirstState = true;
  const listeners = new Set<() => void>();

  let current:
    | { promise: Promise<void> | undefined; redownload: () => Promise<void> }
    | undefined;

  type Entry = NonNullable<typeof current>;

  async function track(entry: Entry, download: Promise<void>): Promise<void> {
    try {
      await download;
      if (current === entry) current = undefined;
    } catch (error) {
      if (current === entry) entry.promise = undefined;
      throw error;
    }
  }

  // a failure is reported to whoever waits for it, if anyone
  function startTracking(entry: Entry, download: Promise<void>): void {
    entry.promise = track(entry, download);
    entry.promise.catch(() => undefined);
  }

  return {
    isAvailable: options.isAvailable,
    isSignedIn: options.isSignedIn,
    waitForFirstState: async () => firstState,
    userDataDownload: (): Promise<void> | undefined => {
      if (current === undefined) return undefined;
      // the last one failed: a Retry starts a new one
      if (current.promise === undefined) {
        startTracking(current, current.redownload());
      }
      return current.promise;
    },
    onChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    stateChanged: (userData) => {
      if (userData === undefined) {
        current = undefined;
      } else {
        current = { promise: undefined, redownload: userData.redownload };
        startTracking(current, userData.download);
      }

      if (isFirstState) {
        isFirstState = false;
        resolveFirstState();
        return;
      }
      for (const listener of listeners) listener();
    },
  };
}
