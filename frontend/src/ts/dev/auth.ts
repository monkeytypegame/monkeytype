// Auth session helpers for the `__mt` debug handle: sign in with the
// QUICK_LOGIN_* account and sign out again. Both resolve only once the app
// snapshot confirms the transition (a sign in keeps a snapshot, a sign out
// clears it; see `db.ts`).
import type { Snapshot } from "../constants/default-snapshot";
import { quickLogin as devQuickLogin } from "./quick-login";

/**
 * Polls the app snapshot every 20ms until `matches` holds, throwing after
 * `timeoutMs`. `undefined` confirms a sign out, an object confirms loaded
 * account data.
 */
async function waitForSnapshot(
  matches: (snapshot: Snapshot | undefined) => boolean,
  description: string,
  timeoutMs = 10_000,
): Promise<void> {
  // lazy: the db collections open indexedDB on import, and the debug handle
  // loads in jsdom tests
  const { getUserData: getSnapshot } = await import("../db");
  const start = Date.now();
  while (!matches(getSnapshot())) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Timed out after ${timeoutMs / 1000}s waiting for the snapshot to ${description}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

/**
 * Signs in with QUICK_LOGIN_EMAIL / QUICK_LOGIN_PASSWORD from the frontend
 * .env, resolving once the account data is loaded (snapshot is set).
 */
export async function quickLogin(): Promise<void> {
  await devQuickLogin();
  await waitForSnapshot(
    (snapshot) => snapshot !== undefined,
    "be set (signed in)",
  );
}

/**
 * Signs out the current session, resolving once the app clears the snapshot;
 * no-op when there is no session.
 */
export async function signOut(): Promise<void> {
  // lazy: auth reads firebase on import, and the debug handle loads eagerly
  const { signOut } = await import("../auth");
  signOut();
  await waitForSnapshot(
    (snapshot) => snapshot === undefined,
    "be cleared (signed out)",
  );
}
