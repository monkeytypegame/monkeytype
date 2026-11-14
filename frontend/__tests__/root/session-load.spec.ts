import { createComputed, createRoot, on } from "solid-js";
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

import * as RemoteConfig from "../../src/ts/config/remote";
import * as Sentry from "../../src/ts/sentry";
import {
  getUserDataLoadState,
  reloadUserData,
} from "../../src/ts/session-load";
import { setUserId } from "../../src/ts/states/core";

// stands in for firebase.ts, the auth signals' writer
function signIn(uid = "uid"): void {
  setUserId(uid);
}
function signOut(): void {
  setUserId(null);
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("session load", () => {
  beforeEach(() => {
    signOut();
    loads.length = 0;
    vi.clearAllMocks();
  });

  it("signing in loads the user data", async () => {
    signIn();

    expect(loads).toHaveLength(1);
    expect(getUserDataLoadState()).toEqual({ status: "loading" });

    loads[0]?.resolve(undefined);
    await settle();

    expect(getUserDataLoadState()).toEqual({ status: "loaded" });
    expect(Sentry.setUser).toHaveBeenCalledWith("uid", "name");
  });

  it("is loading for whoever reacts to signing in before the load starts", () => {
    // computations run before effects, so before the load's effect
    let seen: unknown;
    createRoot(() =>
      createComputed(
        on(
          () => getUserDataLoadState().status,
          (status) => (seen = status),
          { defer: true },
        ),
      ),
    );

    signIn();

    expect(seen).toBe("loading");
  });

  it("a failed load is failed", async () => {
    signIn();
    const error = new Error("down");
    loads[0]?.reject(error);
    await settle();

    expect(getUserDataLoadState()).toEqual({ status: "failed", error });
  });

  it("any exception while loading fails the load, not just a server error", async () => {
    const error = new TypeError("Cannot read properties of undefined");
    vi.mocked(RemoteConfig.applyFromServer).mockRejectedValueOnce(error);

    signIn();
    loads[0]?.resolve(undefined);
    await settle();

    expect(getUserDataLoadState()).toEqual({ status: "failed", error });
  });

  it("reloadUserData loads again after a failure", async () => {
    signIn();
    loads[0]?.reject(new Error("down"));
    await settle();

    const reloaded = reloadUserData();
    expect(getUserDataLoadState()).toEqual({ status: "loading" });
    loads[1]?.resolve(undefined);
    await reloaded;

    expect(getUserDataLoadState()).toEqual({ status: "loaded" });
  });

  it("signing out resets the load and clears the Sentry user, and a load it overtook doesn't set it", async () => {
    signIn();
    signOut();

    expect(getUserDataLoadState()).toEqual({ status: "idle" });
    expect(Sentry.clearUser).toHaveBeenCalled();

    loads[0]?.resolve(undefined);
    await settle();
    expect(getUserDataLoadState()).toEqual({ status: "idle" });
  });

  it("signing in again loads again, ignoring the load it overtook", async () => {
    signIn();
    signOut();
    signIn();
    expect(loads).toHaveLength(2);

    loads[0]?.reject(new Error("stale"));
    await settle();
    expect(getUserDataLoadState()).toEqual({ status: "loading" });

    loads[1]?.resolve(undefined);
    await settle();
    expect(getUserDataLoadState()).toEqual({ status: "loaded" });
  });

  it("the same user reported again doesn't load again", () => {
    signIn();
    signIn();

    expect(loads).toHaveLength(1);
  });

  it("reloadUserData does nothing while signed out", async () => {
    await reloadUserData();

    expect(loads).toHaveLength(0);
    expect(getUserDataLoadState()).toEqual({ status: "idle" });
  });
});
