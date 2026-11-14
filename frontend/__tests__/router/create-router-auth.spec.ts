import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";

import type { UserDataLoadState } from "../../src/ts/auth";
import type { AuthState } from "../../src/ts/states/core";

import { createRouterAuth } from "../../src/ts/router/create-router-auth";

function setup(initial: AuthState = "unknown"): {
  auth: ReturnType<typeof createRouterAuth>;
  setAuthState: (state: AuthState) => void;
  setLoadState: (state: UserDataLoadState) => void;
  reloadUserData: ReturnType<typeof vi.fn>;
} {
  const [authState, setAuthState] = createSignal<AuthState>(initial);
  const [loadState, setLoadState] = createSignal<UserDataLoadState>({
    status: "idle",
  });
  const reloadUserData = vi.fn(async () => {
    setLoadState({ status: "loading" });
  });
  const auth = createRouterAuth({
    isAvailable: () => true,
    authState,
    userDataLoadState: loadState,
    reloadUserData,
  });
  return { auth, setAuthState, setLoadState, reloadUserData };
}

async function isSettled(promise: Promise<unknown>): Promise<boolean> {
  let settled = false;
  promise.then(
    () => (settled = true),
    () => (settled = true),
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  return settled;
}

describe("createRouterAuth", () => {
  it("waits for the first known auth state", async () => {
    const { auth, setAuthState } = setup();
    const first = auth.waitForFirstState();
    expect(await isSettled(first)).toBe(false);

    setAuthState("signedOut");
    expect(await isSettled(first)).toBe(true);
    expect(auth.isSignedIn()).toBe(false);
  });

  it("notifies listeners on changes after the first state only", () => {
    const { auth, setAuthState } = setup();
    const listener = vi.fn();
    auth.onChange(listener);

    setAuthState("signedOut");
    expect(listener).not.toHaveBeenCalled();

    setAuthState("signedIn");
    expect(listener).toHaveBeenCalledOnce();
    expect(auth.isSignedIn()).toBe(true);
  });

  it("has no download unless a load runs", () => {
    const { auth, setLoadState } = setup("signedIn");
    expect(auth.userDataDownload()).toBeUndefined();
    setLoadState({ status: "loaded" });
    expect(auth.userDataDownload()).toBeUndefined();
  });

  it("the download resolves once loaded", async () => {
    const { auth, setLoadState } = setup("signedIn");
    setLoadState({ status: "loading" });
    const download = auth.userDataDownload();
    expect(download).toBe(auth.userDataDownload());

    setLoadState({ status: "loaded" });
    await expect(download).resolves.toBeUndefined();
  });

  it("the download rejects on failure, and a Retry reloads", async () => {
    const { auth, setLoadState, reloadUserData } = setup("signedIn");
    setLoadState({ status: "loading" });
    const download = auth.userDataDownload();
    const error = new Error("down");
    setLoadState({ status: "failed", error });
    await expect(download).rejects.toBe(error);

    const retry = auth.userDataDownload();
    expect(reloadUserData).toHaveBeenCalledOnce();
    expect(retry).toBeDefined();
    setLoadState({ status: "loaded" });
    await expect(retry).resolves.toBeUndefined();
  });

  it("signing out mid-load resolves the download", async () => {
    const { auth, setLoadState } = setup("signedIn");
    setLoadState({ status: "loading" });
    const download = auth.userDataDownload();
    setLoadState({ status: "idle" });
    await expect(download).resolves.toBeUndefined();
  });
});
