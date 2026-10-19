import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import * as Notifications from "../../src/ts/states/notifications";
import { applyUrlActions } from "../../src/ts/url-actions/apply";
import { challengeAction } from "../../src/ts/url-actions/actions/challenge";
import { customThemeAction } from "../../src/ts/url-actions/actions/custom-theme";
import { discordTokenAction } from "../../src/ts/url-actions/actions/discord-oauth";
import { testSettingsAction } from "../../src/ts/url-actions/actions/test-settings";

vi.mock("../../src/ts/url-actions/actions/challenge", () => ({
  challengeAction: {
    in: "search",
    param: "challenge",
    failure: "Failed challenge",
    encoding: "plain",
    schema: z.record(z.string()),
    apply: vi.fn(),
  },
}));
vi.mock("../../src/ts/url-actions/actions/custom-theme", () => ({
  customThemeAction: {
    in: "search",
    param: "customTheme",
    failure: "Failed customTheme",
    encoding: "plain",
    schema: z.record(z.string()),
    apply: vi.fn(),
  },
}));
vi.mock("../../src/ts/url-actions/actions/discord-oauth", () => ({
  discordTokenAction: {
    in: "hash",
    param: "access_token",
    failure: "Failed discordToken",
    encoding: "plain",
    schema: z.record(z.string()),
    apply: vi.fn(),
  },
}));
vi.mock("../../src/ts/url-actions/actions/test-settings", () => ({
  testSettingsAction: {
    in: "search",
    param: "testSettings",
    failure: "Failed testSettings",
    encoding: "plain",
    schema: z.record(z.string()),
    apply: vi.fn(),
  },
}));

const applyChallenge = vi.mocked(challengeAction.apply);
const applyCustomTheme = vi.mocked(customThemeAction.apply);
const applyDiscordToken = vi.mocked(discordTokenAction.apply);
const applyTestSettings = vi.mocked(testSettingsAction.apply);

describe("applyUrlActions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function location(
    searchStr: string,
    hash = "",
  ): Parameters<typeof applyUrlActions>[0] {
    return {
      search: Object.fromEntries(new URLSearchParams(searchStr)),
      searchStr,
      hash,
    };
  }

  it("returns undefined without actions", () => {
    expect(applyUrlActions(location("?foo=1", "top"))).toBeUndefined();
  });

  it("drops the action params and keeps the rest", () => {
    const rest = applyUrlActions(location("?testSettings=abc&foo=1", "top"));

    expect(rest).toEqual({ search: { foo: "1" }, hash: "top" });
    expect(applyTestSettings).toHaveBeenCalledWith({
      testSettings: "abc",
      foo: "1",
    });
  });

  it("reads values from the raw search, keeping their +", () => {
    applyUrlActions(location("?customTheme=a+b%2Fc"));

    expect(applyCustomTheme).toHaveBeenCalledWith({ customTheme: "a+b/c" });
  });

  it("keeps the = padding of base64 values", () => {
    applyUrlActions(location("?customTheme=YQ==&foo=1"));

    expect(applyCustomTheme).toHaveBeenCalledWith({
      customTheme: "YQ==",
      foo: "1",
    });
  });

  it("drops the whole hash for a hash action, passing all its params", async () => {
    const rest = applyUrlActions(
      location("?foo=1", "access_token=a&token_type=b&state=c"),
    );

    expect(rest).toEqual({ search: { foo: "1" }, hash: "" });
    await vi.waitFor(() =>
      expect(applyDiscordToken).toHaveBeenCalledWith({
        access_token: "a",
        token_type: "b",
        state: "c",
      }),
    );
  });

  it("applies the actions in table order, each once the one before is done", async () => {
    const calls: string[] = [];
    let finishTestSettings = (): void => undefined;
    applyTestSettings.mockImplementation(
      async () =>
        new Promise<void>((resolve) => {
          calls.push("testSettings");
          finishTestSettings = resolve;
        }),
    );
    applyChallenge.mockImplementation(async () => {
      calls.push("challenge");
    });
    applyCustomTheme.mockImplementation(() => {
      calls.push("customTheme");
    });

    applyUrlActions(location("?challenge=x&testSettings=y&customTheme=z"));
    await vi.waitFor(() =>
      expect(calls).toEqual(["customTheme", "testSettings"]),
    );

    finishTestSettings();
    await vi.waitFor(() =>
      expect(calls).toEqual(["customTheme", "testSettings", "challenge"]),
    );
  });

  it("shows the failure of an action that throws, then applies the next", async () => {
    const showError = vi
      .spyOn(Notifications, "showErrorNotification")
      .mockImplementation(() => 0);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    applyCustomTheme.mockImplementation(() => {
      throw new Error("nope");
    });
    applyTestSettings.mockRejectedValue(new Error("later"));

    applyUrlActions(location("?customTheme=a&testSettings=b&challenge=c"));

    await vi.waitFor(() =>
      expect(applyChallenge).toHaveBeenCalledWith(
        expect.objectContaining({ challenge: "c" }),
      ),
    );
    expect(showError.mock.calls.map(([message]) => message)).toEqual([
      "Failed customTheme: nope",
      "Failed testSettings: later",
    ]);
  });

  it("shows an invalid url for params the schema rejects, without applying", async () => {
    const showError = vi
      .spyOn(Notifications, "showErrorNotification")
      .mockImplementation(() => 0);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(challengeAction.schema, "safeParse").mockReturnValue(
      z
        .object({ challenge: z.number() })
        .safeParse({ challenge: "x" }) as never,
    );

    applyUrlActions(location("?challenge=x"));

    await vi.waitFor(() =>
      expect(showError).toHaveBeenCalledWith(
        'Invalid challenge url: "challenge" Expected number, received string',
      ),
    );
    expect(applyChallenge).not.toHaveBeenCalled();
  });
});
