// Loads the session data of the signed in user: user, tags, presets, custom
// themes (the session queries, which hold it), remote config and the Sentry
// user. Starts whenever the signed in user changes
// (firebase.ts writes the auth signals); the router's auth context reads its
// state for the blocking user-data step.

import { createMemo, createRoot, createSignal } from "solid-js";

import * as RemoteConfig from "./config/remote";
import { getForcedUserDataLoadFail } from "./dev/fail-user-data-load";
import { createEffectOn } from "./hooks/effects";
import { loadCustomThemes } from "./queries/custom-themes";
import { loadPresets } from "./queries/presets";
import { loadTags } from "./queries/tags";
import { loadUserData } from "./queries/user";
import * as Sentry from "./sentry";
import { getUserId } from "./states/core";
import { UserDataLoadError } from "./utils/user-data-load-error";

/** The signed in user's data load (user, tags, presets, custom themes, remote config). */
export type UserDataLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded" }
  | { status: "failed"; error: unknown };

const idle: UserDataLoadState = { status: "idle" };
const loading: UserDataLoadState = { status: "loading" };

// the latest load started; `id` tells it apart from a load it superseded
const [getLastLoad, setLastLoad] = createSignal<
  { id: number; uid: string; state: UserDataLoadState } | undefined
>();
let lastLoadId = 0;

/**
 * idle while signed out or before the first auth state. Signed in, it's
 * loading until that user's load ends, even before the load has started, so
 * whoever reacts to signing in sees a running load.
 */
export const getUserDataLoadState = createRoot(() =>
  createMemo((): UserDataLoadState => {
    const uid = getUserId();
    if (uid === null) return idle;
    const load = getLastLoad();
    if (load?.uid !== uid) return loading;
    return load.state;
  }),
);

async function getDataAndInit(): Promise<void> {
  console.log("getting account data");
  const forcedFail = getForcedUserDataLoadFail();
  if (forcedFail === "bug") {
    throw new TypeError("forced by dev options (bug)");
  }
  if (forcedFail !== false) {
    throw new UserDataLoadError("forced by dev options", forcedFail);
  }
  // fetch everything in parallel, apply in order below
  const [userData, , , , remoteConfig] = await Promise.all([
    loadUserData(),
    loadTags(),
    loadPresets(),
    loadCustomThemes(),
    RemoteConfig.fetchFromServer(),
  ]);

  void Sentry.setUser(userData.uid, userData.name);

  await RemoteConfig.applyFromServer(remoteConfig);
}

async function load(uid: string): Promise<void> {
  const id = ++lastLoadId;
  setLastLoad({ id, uid, state: loading });
  // a load signing out (or a newer load) overtook doesn't set the state
  const isCurrent = (): boolean =>
    getLastLoad()?.id === id && getUserId() === uid;
  try {
    await getDataAndInit();
    if (isCurrent()) setLastLoad({ id, uid, state: { status: "loaded" } });
  } catch (error) {
    // no notification: the loading page shows the error
    console.error(error);
    if (isCurrent()) {
      setLastLoad({ id, uid, state: { status: "failed", error } });
    }
  }
}

/**
 * Downloads the signed in user's data again, eg. after a failed load (the
 * loading page's Retry). Sets the load state synchronously to loading.
 */
export async function reloadUserData(): Promise<void> {
  const uid = getUserId();
  if (uid === null) return;
  await load(uid);
}

createRoot(() =>
  createEffectOn(getUserId, (uid) => {
    if (uid !== null) {
      void load(uid);
      return;
    }
    // signing out resets the user-scoped queries (queries/index.ts)
    setLastLoad(undefined);
    void Sentry.clearUser();
  }),
);
