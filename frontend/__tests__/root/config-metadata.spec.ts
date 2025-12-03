import { describe, it, expect, afterAll, vi } from "vitest";
import { configMetadata } from "../../src/ts/config-metadata";
import * as Config from "../../src/ts/config";
import { ConfigKey, Config as ConfigType } from "@monkeytype/schemas/configs";

const { replaceConfig, getConfig } = Config.__testing;

type TestsByConfig<T> = Partial<{
  [K in keyof ConfigType]: (T & { value: ConfigType[K] })[];
}>;

describe("ConfigMeta", () => {
  afterAll(() => {
    replaceConfig({});
    vi.resetModules();
  });
  it("should have changeRequiresRestart defined", () => {
    const configsRequiringRestarts = Object.entries(configMetadata)
      .filter(([_key, value]) => value.changeRequiresRestart)
      .map(([key]) => key)
      .sort();

    expect(configsRequiringRestarts).toEqual(
      [
        "punctuation",
        "numbers",
        "words",
        "time",
        "mode",
        "quoteLength",
        "language",
        "difficulty",
        "minWpmCustomSpeed",
        "minWpm",
        "minAcc",
        "minAccCustom",
        "minBurst",
        "minBurstCustomSpeed",
        "britishEnglish",
        "funbox",
        "customLayoutfluid",
        "strictSpace",
        "stopOnError",
        "lazyMode",
        "layout",
        "codeUnindentOnBackspace",
      ].sort(),
    );
  });

  it("should have triggerResize defined", () => {
    const configsWithTriggeResize = Object.entries(configMetadata)
      .filter(([_key, value]) => value.triggerResize === true)
      .map(([key]) => key)
      .sort();

    expect(configsWithTriggeResize).toEqual(
      [
        "fontSize",
        "keymapSize",
        "maxLineWidth",
        "tapeMode",
        "tapeMargin",
      ].sort(),
    );
  });
  describe("overrideValue", () => {
    const testCases: TestsByConfig<{
      given?: Partial<ConfigType>;
      expected: Partial<ConfigType>;
    }> = {
      punctuation: [
        { value: true, expected: { punctuation: true } },
        {
          value: true,
          given: { mode: "quote" },
          expected: { punctuation: false },
        },
      ],
      numbers: [
        { value: true, expected: { numbers: true } },
        {
          value: true,
          given: { mode: "quote" },
          expected: { numbers: false },
        },
      ],
      customLayoutfluid: [
        {
          value: ["qwerty", "qwerty", "qwertz"],
          expected: { customLayoutfluid: ["qwerty", "qwertz"] },
        },
      ],
      customPolyglot: [
        {
          value: ["english", "polish", "english"],
          expected: { customPolyglot: ["english", "polish"] },
        },
      ],
      keymapSize: [
        { value: 1, expected: { keymapSize: 1 } },
        { value: 1.234, expected: { keymapSize: 1.2 } },
        { value: 0.4, expected: { keymapSize: 0.5 } },
        { value: 3.6, expected: { keymapSize: 3.5 } },
      ],
      customBackground: [
        {
          value: " https://example.com/test.jpg ",
          expected: { customBackground: "https://example.com/test.jpg" },
        },
      ],
      accountChart: [
        {
          value: ["on", "off", "off", "off"],
          expected: { accountChart: ["on", "off", "off", "off"] },
        },
        {
          value: ["off", "off", "off", "off"],
          given: { accountChart: ["on", "off", "off", "off"] },
          expected: { accountChart: ["off", "on", "off", "off"] },
        },
        {
          value: ["off", "off", "on", "on"],
          given: { accountChart: ["off", "on", "off", "off"] },
          expected: { accountChart: ["on", "off", "on", "on"] },
        },
      ],
    };

    it.for(
      Object.entries(testCases).flatMap(([key, value]) =>
        value.flatMap((it) => ({ key: key as ConfigKey, ...it })),
      ),
    )(
      `$key value=$value given=$given expect=$expected`,
      ({ key, value, given, expected }) => {
        //GIVEN
        replaceConfig(given ?? {});

        //WHEN
        Config.genericSet(key, value as any);

        //THEN
        expect(getConfig()).toMatchObject(expected);
      },
    );
  });
  describe("isBlocked", () => {
    const testCases: TestsByConfig<{
      given?: Partial<ConfigType>;
      fail?: true;
    }> = {
      funbox: [
        {
          value: ["gibberish"],
          given: { mode: "quote" },
          fail: true,
        },
      ],
      showAllLines: [
        { value: true, given: { tapeMode: "off" } },
        { value: false, given: { tapeMode: "word" } },
        { value: true, given: { tapeMode: "word" }, fail: true },
      ],
    };

    it.for(
      Object.entries(testCases).flatMap(([key, value]) =>
        value.flatMap((it) => ({ key: key as ConfigKey, ...it })),
      ),
    )(
      `$key value=$value given=$given fail=$fail`,
      ({ key, value, given, fail }) => {
        //GIVEN
        replaceConfig(given ?? {});

        //WHEN
        const applied = Config.genericSet(key, value as any);

        //THEN
        expect(applied).toEqual(!fail);
      },
    );
  });

  describe("overrideConfig", () => {
    const testCases: TestsByConfig<{
      given: Partial<ConfigType>;
      expected?: Partial<ConfigType>;
    }> = {
      mode: [
        { value: "time", given: { numbers: true, punctuation: true } },
        {
          value: "custom",
          given: { numbers: true, punctuation: true },
          expected: { numbers: false, punctuation: false },
        },
        {
          value: "quote",
          given: { numbers: true, punctuation: true },
          expected: { numbers: false, punctuation: false },
        },
        {
          value: "zen",
          given: { numbers: true, punctuation: true },
          expected: { numbers: false, punctuation: false },
        },
      ],
      numbers: [{ value: false, given: { mode: "quote" } }],
      freedomMode: [
        {
          value: false,
          given: { confidenceMode: "on" },
          expected: { confidenceMode: "on" },
        },
        {
          value: true,
          given: { confidenceMode: "on" },
          expected: { confidenceMode: "off" },
        },
      ],
      stopOnError: [
        {
          value: "off",
          given: { confidenceMode: "on" },
          expected: { confidenceMode: "on" },
        },
        {
          value: "word",
          given: { confidenceMode: "on" },
          expected: { confidenceMode: "off" },
        },
      ],
      confidenceMode: [
        {
          value: "off",
          given: { freedomMode: true, stopOnError: "word" },
          expected: { freedomMode: true, stopOnError: "word" },
        },
        {
          value: "on",
          given: { freedomMode: true, stopOnError: "word" },
          expected: { freedomMode: false, stopOnError: "off" },
        },
      ],
      tapeMode: [
        {
          value: "off",
          given: { showAllLines: true },
          expected: { showAllLines: true },
        },
        {
          value: "letter",
          given: { showAllLines: true },
          expected: { showAllLines: false },
        },
      ],
      theme: [
        {
          value: "8008",
          given: { customTheme: true },
          expected: { customTheme: false },
        },
      ],
      keymapLayout: [
        {
          value: "3l",
          given: { keymapMode: "react" },
          expected: { keymapMode: "react" },
        },
        {
          value: "3l",
          given: { keymapMode: "off" },
          expected: { keymapMode: "static" },
        },
      ],
      keymapStyle: [
        {
          value: "alice",
          given: { keymapMode: "react" },
          expected: { keymapMode: "react" },
        },
        {
          value: "alice",
          given: { keymapMode: "off" },
          expected: { keymapMode: "static" },
        },
      ],
      keymapLegendStyle: [
        {
          value: "dynamic",
          given: { keymapMode: "react" },
          expected: { keymapMode: "react" },
        },
        {
          value: "dynamic",
          given: { keymapMode: "off" },
          expected: { keymapMode: "static" },
        },
      ],
      keymapShowTopRow: [
        {
          value: "always",
          given: { keymapMode: "react" },
          expected: { keymapMode: "react" },
        },
        {
          value: "always",
          given: { keymapMode: "off" },
          expected: { keymapMode: "static" },
        },
      ],
      keymapSize: [
        {
          value: 2,
          given: { keymapMode: "react" },
          expected: { keymapMode: "react" },
        },
        {
          value: 2,
          given: { keymapMode: "off" },
          expected: { keymapMode: "static" },
        },
      ],
    };

    it.for(
      Object.entries(testCases).flatMap(([key, value]) =>
        value.flatMap((it) => ({ key: key as ConfigKey, ...it })),
      ),
    )(
      `$key value=$value given=$given expected=$expected`,
      ({ key, value, given, expected }) => {
        //GIVEN
        replaceConfig(given);

        //WHEN
        Config.genericSet(key, value as any);

        //THEN
        expect(getConfig()).toMatchObject(expected ?? {});
      },
    );
  });
});
