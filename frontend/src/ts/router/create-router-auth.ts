// The router's view of auth: the first auth state, change listeners and the
// user data load of the signed in user. Reads signals and has no side effects
// of its own, so tests drive the real thing (the app passes the auth signals,
// router/app-router.ts)

import { createRoot } from "solid-js";

import type { UserDataLoadState } from "../session-data";
import type { AuthState } from "../states/core";

import { createEffectOn } from "../hooks/effects";
import { promiseWithResolvers } from "../utils/misc";

/** What routes need to know about auth. Made by createRouterAuth. */
export type RouterAuth = {
  /** False when auth failed to load - guarded pages send users to the test page. */
  isAvailable: () => boolean;
  isSignedIn: () => boolean;
  /** Resolves once the first auth state is known. */
  waitForFirstState: () => Promise<void>;
  /**
   * The user data load of the signed in user while it runs: resolves once
   * loaded, rejects if it failed. After a failed one it starts a new one
   * (Retry). undefined if there's none to wait for.
   */
  userDataDownload: () => Promise<void> | undefined;
  /** Calls `listener` on every auth state change after the first. Returns an unsubscribe. */
  onChange: (listener: () => void) => () => void;
  /** Signs out, eg. to continue past a failed user data load. */
  signOut: () => void;
};

export type RouterAuthSource = {
  isAvailable: () => boolean;
  authState: () => AuthState;
  userDataLoadState: () => UserDataLoadState;
  /** Starts a new user data load, setting the load state to loading synchronously. */
  reloadUserData: () => Promise<void>;
  signOut: () => void;
};

export function createRouterAuth(source: RouterAuthSource): RouterAuth {
  const { promise: firstState, resolve: resolveFirstState } =
    promiseWithResolvers();
  const listeners = new Set<() => void>();

  // the failure the router saw last: asking again for it is a Retry
  let reportedFailure: UserDataLoadState | undefined;

  // the waiters of the running load
  let running:
    | {
        promise: Promise<void>;
        resolve: () => void;
        reject: (error: unknown) => void;
      }
    | undefined;

  createRoot(() => {
    createEffectOn(source.authState, (state, prev) => {
      if (state === "unknown") return;
      if (prev === undefined || prev === "unknown") {
        resolveFirstState();
        return;
      }
      for (const listener of listeners) listener();
    });

    createEffectOn(source.userDataLoadState, (load) => {
      if (load.status === "loading" || running === undefined) return;
      const waiters = running;
      running = undefined;
      if (load.status === "failed") {
        reportedFailure = load;
        waiters.reject(load.error);
      } else {
        waiters.resolve();
      }
    });
  });

  return {
    isAvailable: source.isAvailable,
    signOut: source.signOut,
    isSignedIn: () => source.authState() === "signedIn",
    waitForFirstState: async () => firstState,
    userDataDownload: (): Promise<void> | undefined => {
      const load = source.userDataLoadState();
      if (load.status === "failed") {
        // failed before the router asked: report it, don't load again
        if (reportedFailure !== load) {
          reportedFailure = load;
          const failed = Promise.reject(load.error);
          failed.catch(() => undefined);
          return failed;
        }
        // asked again after seeing it fail: a Retry starts a new one
        void source.reloadUserData();
      }
      if (source.userDataLoadState().status !== "loading") return undefined;
      if (running === undefined) {
        running = promiseWithResolvers();
        // a failure is reported to whoever waits for it, if anyone
        running.promise.catch(() => undefined);
      }
      return running.promise;
    },
    onChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
