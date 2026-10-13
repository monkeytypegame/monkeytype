import { authEvent } from "../events/auth";
import { isAuthAvailable } from "../firebase";
import { isAuthenticated } from "../states/core";
import { promiseWithResolvers } from "../utils/misc";
import type { RouterAuth } from "./context";
import { createUserDataDownload } from "./user-data-download";

const { promise: firstAuthState, resolve: resolveFirstAuthState } =
  promiseWithResolvers();

let isFirstAuthState = true;
const userData = createUserDataDownload();
const listeners = new Set<() => void>();

authEvent.subscribe((event) => {
  if (event.type !== "authStateChanged") return;

  if (event.data.isUserSignedIn) {
    userData.start(event.data.loadPromise, event.data.reloadUserData);
  } else {
    userData.clear();
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
  userDataDownload: userData.get,
  onChange: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
