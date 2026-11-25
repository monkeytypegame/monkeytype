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
vi.mock("../../src/ts/ape/user", () => ({ clearUserResponse: vi.fn() }));
vi.mock("../../src/ts/integrations/sentry", () => ({
  setSentryUser: vi.fn(),
  clearSentryUser: vi.fn(),
}));

import { clearUserResponse } from "../../src/ts/ape/user";
import * as RemoteConfig from "../../src/ts/config/remote";
import {
  clearSentryUser,
  setSentryUser,
} from "../../src/ts/integrations/sentry";
import {
  getUserDataLoadState,
  reloadUserData,
} from "../../src/ts/session-data";
import { setTestUserId } from "../__harness__/auth-user";

// stands in for auth/system.ts, the auth signals' writer
function signIn(uid = "uid"): void {
  setTestUserId(uid);
}
function signOut(): void {
  setTestUserId(null);
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("session data", () => {
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
    expect(setSentryUser).toHaveBeenCalledWith("uid", "name");
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

  it("reloadUserData downloads the user again, not the cached response", async () => {
    signIn();
    loads[0]?.reject(new Error("down"));
    await settle();
    expect(clearUserResponse).not.toHaveBeenCalled();

    const reloaded = reloadUserData();
    expect(clearUserResponse).toHaveBeenCalledOnce();
    loads[1]?.resolve(undefined);
    await reloaded;
  });

  it("signing out resets the load and clears the Sentry user, and a load it overtook doesn't set it", async () => {
    signIn();
    signOut();

    expect(getUserDataLoadState()).toEqual({ status: "idle" });
    expect(clearSentryUser).toHaveBeenCalled();

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
