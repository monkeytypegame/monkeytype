import { authEvent } from "../events/auth";
import { withLoading } from "../states/loading-page";
import { promiseWithResolvers } from "../utils/misc";

const { promise: firstAuthState, resolve: resolveFirstAuthState } =
  promiseWithResolvers();

let firstAuthStateResolved = false;
let pendingUserData: Promise<void> | undefined;
let onAuthStateChange: (() => void) | undefined;

/**
 * Called on every auth state change after the first one,
 * so the router can re-run guards and loaders.
 */
export function setOnAuthStateChange(fn: () => void): void {
  onAuthStateChange = fn;
}

authEvent.subscribe((event) => {
  if (event.type !== "authStateChanged") return;

  if (event.data.isUserSignedIn) {
    pendingUserData = event.data.loadPromise;
  }

  // the first auth state is awaited by waitForUserData during the initial load
  if (!firstAuthStateResolved) {
    firstAuthStateResolved = true;
    resolveFirstAuthState();
    return;
  }
  onAuthStateChange?.();
});

/**
 * Waits until the auth state is known, then shows the loading bar while the
 * user data downloads (only once per sign in).
 */
export async function waitForUserData(): Promise<void> {
  await firstAuthState;

  const userData = pendingUserData;
  if (userData === undefined) return;
  pendingUserData = undefined;

  await withLoading("user data", {
    style: "bar",
    shouldShow: () => true,
    load: async () => userData,
    keyframes: [
      { percentage: 90, durationMs: 1000, text: "Downloading user data..." },
    ],
  });
}
