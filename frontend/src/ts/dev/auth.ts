// Auth session helpers for the `__mt` debug handle: sign in with the
// QUICK_LOGIN_* account, sign out again, wait for the account data. They
// resolve only once the app confirms the transition (a sign in loads the
// account data and applies its config, a sign out clears the user; see
// `session-data.ts`, `queries/user.ts`).
import { quickLogin as devQuickLogin } from "./quick-login";

/**
 * Polls `check` every 20ms until it returns true, throwing after `timeoutMs`
 * or when it throws.
 */
async function waitFor(
  check: () => boolean,
  description: string,
  timeoutMs = 10_000,
): Promise<void> {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Timed out after ${timeoutMs / 1000}s waiting for ${description}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

/**
 * Resolves once the signed in user's account data has loaded and its config
 * is applied (at once when signed out); rejects when the load fails.
 */
export async function whenUserDataLoaded(): Promise<void> {
  // lazy: session data pulls in the api client, and the debug handle loads
  // in jsdom tests
  const { getUserDataLoadState } = await import("../session-data");
  await waitFor(() => {
    const state = getUserDataLoadState();
    if (state.status === "failed") {
      throw new Error("The account data failed to load", {
        cause: state.error,
      });
    }
    return state.status !== "loading";
  }, "the account data to load");
}

/**
 * Signs in with QUICK_LOGIN_EMAIL / QUICK_LOGIN_PASSWORD from the frontend
 * .env, resolving once the account data is loaded and its config applied.
 */
export async function quickLogin(): Promise<void> {
  await devQuickLogin();
  const { getUserId } = await import("../auth/state");
  await waitFor(() => getUserId() !== null, "the user to sign in");
  await whenUserDataLoaded();
}

/**
 * Signs out the current session, resolving once the app clears the user;
 * no-op when there is no session.
 */
export async function signOut(): Promise<void> {
  // lazy: auth reads firebase on import, and the debug handle loads eagerly
  const { signOut } = await import("../auth/actions");
  signOut();
  const { getUserData } = await import("../queries/user");
  await waitFor(() => getUserData() === undefined, "the user to sign out");
}
