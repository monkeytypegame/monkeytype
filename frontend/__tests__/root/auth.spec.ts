import { beforeEach, describe, expect, it, vi } from "vitest";

const { loads } = vi.hoisted(() => ({
  loads: [] as PromiseWithResolvers<undefined>[],
}));

// every user data load waits on the user download, which the test settles
vi.mock("../../src/ts/queries/user", () => ({
  loadUserData: vi.fn(async () => {
    const load = Promise.withResolvers<undefined>();
    loads.push(load);
    await load.promise;
    return { uid: "uid", name: "name" };
  }),
}));
vi.mock("../../src/ts/queries/tags", () => ({ loadTags: vi.fn() }));
vi.mock("../../src/ts/queries/presets", () => ({ loadPresets: vi.fn() }));
vi.mock("../../src/ts/queries/custom-themes", () => ({
  loadCustomThemes: vi.fn(),
}));
vi.mock("../../src/ts/config/remote", () => ({
  fetchFromServer: vi.fn(async () => ({})),
  applyFromServer: vi.fn(async () => undefined),
}));
vi.mock("../../src/ts/sentry", () => ({
  setUser: vi.fn(),
  clearUser: vi.fn(),
}));
vi.mock("../../src/ts/firebase", () => ({
  isAuthAvailable: () => true,
  getAuthenticatedUser: () => null,
  signOut: vi.fn(),
}));
vi.mock("../../src/ts/states/notifications", () => ({
  showErrorNotification: vi.fn(),
  showNoticeNotification: vi.fn(),
  showSuccessNotification: vi.fn(),
}));

import type { User } from "firebase/auth";

import {
  getUserDataLoadState,
  onAuthStateChanged,
  reloadUserData,
} from "../../src/ts/auth";
import * as Firebase from "../../src/ts/firebase";
import { showErrorNotification } from "../../src/ts/states/notifications";
import { getAuthState, getUserId } from "../../src/ts/states/core";

const user = { uid: "uid" } as User;

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("auth", () => {
  beforeEach(async () => {
    await onAuthStateChanged(true, null);
    loads.length = 0;
    vi.clearAllMocks();
  });

  it("signing in sets the auth state and loads the user data", async () => {
    const signedIn = onAuthStateChanged(true, user);

    expect(getUserId()).toBe("uid");
    expect(getAuthState()).toBe("signedIn");
    expect(getUserDataLoadState()).toEqual({ status: "loading" });

    loads[0]?.resolve(undefined);
    await signedIn;

    expect(getUserDataLoadState()).toEqual({ status: "loaded" });
  });

  it("a failed load is failed, without signing out", async () => {
    const signedIn = onAuthStateChanged(true, user);
    const error = new Error("down");
    loads[0]?.reject(error);
    await signedIn;

    expect(getUserDataLoadState()).toEqual({ status: "failed", error });
    expect(getAuthState()).toBe("signedIn");
    expect(Firebase.signOut).not.toHaveBeenCalled();
    // the loading page shows the error
    expect(showErrorNotification).not.toHaveBeenCalled();
  });

  it("reloadUserData loads again after a failure", async () => {
    const signedIn = onAuthStateChanged(true, user);
    loads[0]?.reject(new Error("down"));
    await signedIn;

    const reloaded = reloadUserData();
    expect(getUserDataLoadState()).toEqual({ status: "loading" });
    loads[1]?.resolve(undefined);
    await reloaded;

    expect(getUserDataLoadState()).toEqual({ status: "loaded" });
  });

  it("signing out resets the load, and a load it overtook doesn't set it", async () => {
    void onAuthStateChanged(true, user);
    await onAuthStateChanged(true, null);

    expect(getUserId()).toBeNull();
    expect(getAuthState()).toBe("signedOut");
    expect(getUserDataLoadState()).toEqual({ status: "idle" });

    loads[0]?.resolve(undefined);
    await settle();
    expect(getUserDataLoadState()).toEqual({ status: "idle" });
  });

  it("auth failing to load is signed out", async () => {
    await onAuthStateChanged(false, null);

    expect(getAuthState()).toBe("signedOut");
    expect(getUserDataLoadState()).toEqual({ status: "idle" });
  });

  it("reloadUserData does nothing while signed out", async () => {
    await reloadUserData();

    expect(loads).toHaveLength(0);
    expect(getUserDataLoadState()).toEqual({ status: "idle" });
  });
});
