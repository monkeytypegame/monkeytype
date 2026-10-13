import { authEvent } from "../events/auth";
import { isAuthAvailable } from "../firebase";
import { isAuthenticated } from "../states/core";
import { promiseWithResolvers } from "../utils/misc";
import type { RouterAuth } from "./context";

const { promise: firstAuthState, resolve: resolveFirstAuthState } =
  promiseWithResolvers();

let isFirstAuthState = true;
let pendingUserData: Promise<void> | undefined;
const listeners = new Set<() => void>();

authEvent.subscribe((event) => {
  if (event.type !== "authStateChanged") return;

  if (event.data.isUserSignedIn) {
    pendingUserData = event.data.loadPromise;
  }

  if (isFirstAuthState) {
    isFirstAuthState = false;
    resolveFirstAuthState();
    return;
  }
  for (const listener of listeners) listener();
});

/** The router's view of the app's auth state. */
export const routerAuth: RouterAuth = {
  isAvailable: isAuthAvailable,
  isSignedIn: isAuthenticated,
  waitForFirstState: async () => firstAuthState,
  takeUserDataDownload: (): Promise<void> | undefined => {
    const userData = pendingUserData;
    pendingUserData = undefined;
    return userData;
  },
  onChange: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
