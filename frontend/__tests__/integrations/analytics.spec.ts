import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getFirebaseApp: vi.fn(),
  getAnalytics: vi.fn(),
  logEvent: vi.fn(),
  setAnalyticsCollectionEnabled: vi.fn(),
}));

// analytics gets the Firebase app itself: auth never starts in these tests
vi.mock("../../src/ts/integrations/firebase-app", () => ({
  getFirebaseApp: mocks.getFirebaseApp,
}));
vi.mock("firebase/analytics", () => ({
  getAnalytics: mocks.getAnalytics,
  logEvent: mocks.logEvent,
  setAnalyticsCollectionEnabled: mocks.setAnalyticsCollectionEnabled,
}));

async function freshModule(): Promise<
  typeof import("../../src/ts/integrations/analytics")
> {
  vi.resetModules();
  return import("../../src/ts/integrations/analytics");
}

const app = { name: "app" };
const analytics = { app };

describe("analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.getFirebaseApp.mockResolvedValue(app);
    mocks.getAnalytics.mockReturnValue(analytics);
  });

  it("activates on its own Firebase app and logs events", async () => {
    const { activateAnalytics, logAnalyticsEvent } = await freshModule();

    await activateAnalytics();
    await logAnalyticsEvent("event", { a: "b" });

    expect(mocks.getAnalytics).toHaveBeenCalledWith(app);
    expect(mocks.setAnalyticsCollectionEnabled).toHaveBeenCalledWith(
      analytics,
      true,
    );
    expect(mocks.logEvent).toHaveBeenCalledWith(analytics, "event", {
      a: "b",
    });
  });

  it("drops events logged before activation", async () => {
    const { logAnalyticsEvent } = await freshModule();

    await logAnalyticsEvent("event");

    expect(mocks.logEvent).not.toHaveBeenCalled();
  });

  it("activates once, even when called again while the app loads", async () => {
    const { activateAnalytics } = await freshModule();

    await Promise.all([activateAnalytics(), activateAnalytics()]);

    expect(mocks.getFirebaseApp).toHaveBeenCalledOnce();
    expect(mocks.getAnalytics).toHaveBeenCalledOnce();
  });

  it("can activate again after a failed activation", async () => {
    mocks.getFirebaseApp.mockRejectedValueOnce(new Error("no config"));
    const { activateAnalytics, logAnalyticsEvent } = await freshModule();

    await activateAnalytics();
    await logAnalyticsEvent("event");
    expect(mocks.logEvent).not.toHaveBeenCalled();

    await activateAnalytics();
    await logAnalyticsEvent("event");
    expect(mocks.getAnalytics).toHaveBeenCalledOnce();
    expect(mocks.logEvent).toHaveBeenCalledOnce();
  });
});
