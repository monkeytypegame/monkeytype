import { beforeEach, describe, expect, it, vi } from "vitest";

// setup mocks the Firebase app module itself
vi.unmock("../../src/ts/integrations/firebase-app");

const sdk = vi.hoisted(() => ({
  apps: [] as unknown[],
  initializeApp: vi.fn(),
  getApp: vi.fn(),
}));

vi.mock("firebase/app", () => ({
  getApps: () => sdk.apps,
  getApp: sdk.getApp,
  initializeApp: sdk.initializeApp,
}));
vi.mock("../../src/ts/constants/firebase-config", () => ({
  firebaseConfig: { projectId: "test" },
}));

async function freshModule(): Promise<
  typeof import("../../src/ts/integrations/firebase-app")
> {
  vi.resetModules();
  return import("../../src/ts/integrations/firebase-app");
}

describe("getFirebaseApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sdk.apps = [];
  });

  it("initialises the app once, for concurrent callers too", async () => {
    const app = { name: "app" };
    sdk.initializeApp.mockReturnValue(app);
    const { getFirebaseApp } = await freshModule();

    const [a, b] = await Promise.all([getFirebaseApp(), getFirebaseApp()]);

    expect(a).toBe(app);
    expect(b).toBe(app);
    expect(await getFirebaseApp()).toBe(app);
    expect(sdk.initializeApp).toHaveBeenCalledOnce();
    expect(sdk.initializeApp).toHaveBeenCalledWith({ projectId: "test" });
  });

  it("reuses an app that already exists", async () => {
    const existing = { name: "existing" };
    sdk.apps = [existing];
    sdk.getApp.mockReturnValue(existing);
    const { getFirebaseApp } = await freshModule();

    expect(await getFirebaseApp()).toBe(existing);
    expect(sdk.initializeApp).not.toHaveBeenCalled();
  });

  it("tries again after a failed load", async () => {
    const app = { name: "app" };
    sdk.initializeApp
      .mockImplementationOnce(() => {
        throw new Error("failed");
      })
      .mockReturnValue(app);
    const { getFirebaseApp } = await freshModule();

    await expect(getFirebaseApp()).rejects.toThrow("failed");
    expect(await getFirebaseApp()).toBe(app);
    expect(sdk.initializeApp).toHaveBeenCalledTimes(2);
  });
});
