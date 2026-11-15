import { describe, it, expect, vi } from "vitest";

const { config, auth } = vi.hoisted(() => ({
  config: Promise.withResolvers<undefined>(),
  auth: Promise.withResolvers<undefined>(),
}));

vi.mock("../../src/ts/config/lifecycle", () => ({
  loadFromLocalStorage: vi.fn(async () => config.promise),
}));
vi.mock("../../src/ts/firebase", () => ({
  authPromise: auth.promise,
  initFirebase: vi.fn(async () => undefined),
}));
vi.mock("../../src/ts/anim", () => ({ applyEngineSettings: vi.fn() }));
vi.mock("../../src/ts/cookies", () => ({
  getAcceptedCookies: () => null,
  activateWhatsAccepted: vi.fn(),
}));
vi.mock("../../src/ts/states/modals", () => ({ showModal: vi.fn() }));
vi.mock("../../src/ts/utils/version", () => ({
  fetchLatestVersion: vi.fn(async () => null),
}));
vi.mock("../../src/ts/elements/merch-banner", () => ({
  showIfNotClosedBefore: vi.fn(),
}));
vi.mock("../../src/ts/elements/psa", () => ({ init: vi.fn() }));
vi.mock("../../src/ts/states/connection", () => ({ initConnection: vi.fn() }));
vi.mock("../../src/ts/ape/server-configuration", () => ({
  sync: vi.fn(async () => undefined),
}));
vi.mock("../../src/ts/utils/env", () => ({ isDevEnvironment: () => false }));

import * as ServerConfiguration from "../../src/ts/ape/server-configuration";
import { boot } from "../../src/ts/boot";
import { loadFromLocalStorage } from "../../src/ts/config/lifecycle";
import { initFirebase } from "../../src/ts/firebase";
import * as MerchBanner from "../../src/ts/elements/merch-banner";
import * as Psa from "../../src/ts/elements/psa";
import { initConnection } from "../../src/ts/states/connection";
import { isAppReady } from "../../src/ts/states/core";

describe("boot", () => {
  it("starts the config load and Firebase, then waits for both before the app is ready", async () => {
    const booted = boot();

    // started before awaiting, so the first auth state change shows PSAs
    expect(initConnection).toHaveBeenCalledOnce();
    expect(Psa.init).toHaveBeenCalledOnce();
    expect(loadFromLocalStorage).toHaveBeenCalledOnce();
    expect(initFirebase).toHaveBeenCalledOnce();

    auth.resolve(undefined);
    await Promise.resolve();
    expect(isAppReady()).toBe(false);

    config.resolve(undefined);
    await booted;

    expect(isAppReady()).toBe(true);
    expect(MerchBanner.showIfNotClosedBefore).toHaveBeenCalledOnce();
    expect(ServerConfiguration.sync).toHaveBeenCalledOnce();
  });
});
