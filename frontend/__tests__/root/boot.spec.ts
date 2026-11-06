import { describe, it, expect, vi } from "vitest";

const { config, auth } = vi.hoisted(() => ({
  config: Promise.withResolvers<undefined>(),
  auth: Promise.withResolvers<undefined>(),
}));

vi.mock("../../src/ts/config/lifecycle", () => ({
  configLoadPromise: config.promise,
}));
vi.mock("../../src/ts/firebase", () => ({ authPromise: auth.promise }));
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
import * as MerchBanner from "../../src/ts/elements/merch-banner";
import * as Psa from "../../src/ts/elements/psa";
import { initConnection } from "../../src/ts/states/connection";
import { isAppReady } from "../../src/ts/states/core";

describe("boot", () => {
  it("waits for config, then auth, before the app is ready", async () => {
    const booted = boot();

    // started before awaiting, so the first auth state change shows PSAs
    expect(initConnection).toHaveBeenCalledOnce();
    expect(Psa.init).toHaveBeenCalledOnce();

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
