import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
  Mock,
} from "vitest";

// Track mock instances
const mockGet = vi.fn().mockReturnValue(false);
const mockSet = vi.fn();

// Mock LocalStorageWithSchema as a class constructor
vi.mock("../../src/ts/utils/local-storage-with-schema", () => ({
  LocalStorageWithSchema: class {
    get = mockGet;
    set = mockSet;
  },
}));

// Mock the banner state module before importing the module under test
vi.mock("../../src/ts/states/banners", () => ({
  addBanner: vi.fn().mockReturnValue(1),
  removeBanner: vi.fn(),
}));

import { addBanner, removeBanner } from "../../src/ts/states/banners";

describe("pwa-install-banner", () => {
  const originalUserAgent = navigator.userAgent;
  let matchMediaResult: { matches: boolean };
  let addEventListenerSpy: Mock;
  let listeners: Map<string, EventListener>;

  beforeAll(async () => {
    // Warm up the module and its component imports so first test doesn't time out during transform
    await loadModule();
  }, 20000);

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockGet.mockReturnValue(false);

    matchMediaResult = { matches: false };
    listeners = new Map();

    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(matchMediaResult));

    addEventListenerSpy = vi.fn((event: string, handler: EventListener) => {
      listeners.set(event, handler);
    });
    vi.stubGlobal("addEventListener", addEventListenerSpy);

    // Default: desktop Chrome
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(navigator, "userAgent", {
      value: originalUserAgent,
      configurable: true,
    });
  });

  async function loadModule(): Promise<
    typeof import("../../src/ts/elements/pwa-install-banner")
  > {
    return import("../../src/ts/elements/pwa-install-banner");
  }

  it("should not show the banner when running in standalone mode", async () => {
    matchMediaResult.matches = true;
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(matchMediaResult));

    const mod = await loadModule();
    mod.init();
    mod.showIfNotClosedBefore();

    expect(addBanner).not.toHaveBeenCalled();
  });

  it("should not show the banner when previously dismissed", async () => {
    mockGet.mockReturnValue(true);

    const mod = await loadModule();
    mod.init();
    mod.showIfNotClosedBefore();

    expect(addBanner).not.toHaveBeenCalled();
  });

  it("should listen for beforeinstallprompt event on init", async () => {
    const mod = await loadModule();
    mod.init();

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "beforeinstallprompt",
      expect.any(Function),
    );
  });

  it("should listen for appinstalled event on init", async () => {
    const mod = await loadModule();
    mod.init();

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "appinstalled",
      expect.any(Function),
    );
  });

  it("should buffer early beforeinstallprompt and show once showIfNotClosedBefore runs", async () => {
    const mod = await loadModule();
    mod.init();

    // Event fires BEFORE app initialization awaits finish
    const handler = listeners.get("beforeinstallprompt");
    expect(handler).toBeDefined();

    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue({ outcome: "dismissed" }),
    };
    handler?.(mockEvent as unknown as Event);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    // Not shown yet because showIfNotClosedBefore hasn't run
    expect(addBanner).not.toHaveBeenCalled();

    // Now app finishes booting
    mod.showIfNotClosedBefore();
    expect(addBanner).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "notice",
        icon: "fas fa-fw fa-download",
      }),
    );
  });

  it("should show banner immediately if beforeinstallprompt fires after showIfNotClosedBefore", async () => {
    const mod = await loadModule();
    mod.init();
    mod.showIfNotClosedBefore();

    const handler = listeners.get("beforeinstallprompt");
    expect(handler).toBeDefined();

    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue({ outcome: "dismissed" }),
    };
    handler?.(mockEvent as unknown as Event);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(addBanner).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "notice",
        icon: "fas fa-fw fa-download",
      }),
    );
  });

  it("should remove banner when appinstalled fires", async () => {
    const mod = await loadModule();
    mod.init();
    mod.showIfNotClosedBefore();

    const bipHandler = listeners.get("beforeinstallprompt");
    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue({ outcome: "accepted" }),
    };
    bipHandler?.(mockEvent as unknown as Event);

    const aiHandler = listeners.get("appinstalled");
    aiHandler?.(new Event("appinstalled"));

    expect(removeBanner).toHaveBeenCalled();
  });

  it("should show iOS Safari instructions on iOS Safari", async () => {
    Object.defineProperty(navigator, "userAgent", {
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      configurable: true,
    });

    const mod = await loadModule();
    mod.init();
    mod.showIfNotClosedBefore();

    expect(addBanner).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "notice",
        icon: "fas fa-fw fa-download",
      }),
    );
  });

  it("should not show iOS instructions on third-party iOS browsers (Chrome, Opera, DuckDuckGo)", async () => {
    const nonSafariUas = [
      // Chrome on iOS
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1",
      // Opera on iOS
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 OPiOS/20.0.0",
      // DuckDuckGo on iOS
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 Ddg/7.0",
    ];

    for (const ua of nonSafariUas) {
      vi.clearAllMocks();
      Object.defineProperty(navigator, "userAgent", {
        value: ua,
        configurable: true,
      });

      const mod = await loadModule();
      mod.init();
      mod.showIfNotClosedBefore();

      expect(addBanner).not.toHaveBeenCalled();
    }
  });
});
