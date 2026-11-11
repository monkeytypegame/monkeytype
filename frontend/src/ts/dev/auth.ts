// Auth session helpers for the `__mt` debug handle: sign in with the
// QUICK_LOGIN_* account and sign out again. Both resolve only once the user
// store confirms the transition (a sign in loads the user, a sign out clears
// it; see `states/user.ts`).
import type { UserData } from "../constants/user-data";
import type { DeepReadonly } from "../utils/types";
import { quickLogin as devQuickLogin } from "./quick-login";

/**
 * Polls the user store every 20ms until `matches` holds, throwing after
 * `timeoutMs`. `undefined` confirms a sign out, an object confirms loaded
 * account data.
 */
async function waitForUser(
  matches: (user: DeepReadonly<UserData> | undefined) => boolean,
  description: string,
  timeoutMs = 10_000,
): Promise<void> {
  // lazy: the user store pulls in the api client, and the debug handle loads
  // in jsdom tests
  const { getUserData: getUser } = await import("../states/user");
  const start = Date.now();
  while (!matches(getUser())) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Timed out after ${timeoutMs / 1000}s waiting for the user to ${description}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

/**
 * Signs in with QUICK_LOGIN_EMAIL / QUICK_LOGIN_PASSWORD from the frontend
 * .env, resolving once the account data is loaded (user is set).
 */
export async function quickLogin(): Promise<void> {
  await devQuickLogin();
  await waitForUser((user) => user !== undefined, "be set (signed in)");
}

/**
 * Signs out the current session, resolving once the app clears the user;
 * no-op when there is no session.
 */
export async function signOut(): Promise<void> {
  // lazy: auth reads firebase on import, and the debug handle loads eagerly
  const { signOut } = await import("../auth");
  signOut();
  await waitForUser((user) => user === undefined, "be cleared (signed out)");
}
