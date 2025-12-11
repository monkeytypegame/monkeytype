import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import * as Config from "../../src/ts/config";
import * as Misc from "../../src/ts/utils/misc";
import {
  CustomThemeColors,
  ConfigKey,
  Config as ConfigType,
  CaretStyleSchema,
} from "@monkeytype/schemas/configs";
import { randomBytes } from "crypto";
import * as FunboxValidation from "../../src/ts/test/funbox/funbox-validation";
import * as ConfigValidation from "../../src/ts/config-validation";
import * as ConfigEvent from "../../src/ts/observables/config-event";
import * as DB from "../../src/ts/db";
import * as AccountButton from "../../src/ts/elements/account-button";
import * as Notifications from "../../src/ts/elements/notifications";
const { replaceConfig, getConfig } = Config.__testing;

describe("Config", () => {
  const isDevEnvironmentMock = vi.spyOn(Misc, "isDevEnvironment");
  beforeEach(() => {
    isDevEnvironmentMock.mockClear();
    replaceConfig({});
  });

  describe("test with mocks", () => {
    const canSetConfigWithCurrentFunboxesMock = vi.spyOn(
      FunboxValidation,
      "canSetConfigWithCurrentFunboxes",
    );
    const isConfigValueValidMock = vi.spyOn(
      ConfigValidation,
      "isConfigValueValid",
    );
    const dispatchConfigEventMock = vi.spyOn(ConfigEvent, "dispatch");
    const dbSaveConfigMock = vi.spyOn(DB, "saveConfig");
    const accountButtonLoadingMock = vi.spyOn(AccountButton, "loading");
    const notificationAddMock = vi.spyOn(Notifications, "add");
    const miscReloadAfterMock = vi.spyOn(Misc, "reloadAfter");
    const miscTriggerResizeMock = vi.spyOn(Misc, "triggerResize");

    const mocks = [
      canSetConfigWithCurrentFunboxesMock,
      isConfigValueValidMock,
      dispatchConfigEventMock,
      dbSaveConfigMock,
      accountButtonLoadingMock,
      notificationAddMock,
      miscReloadAfterMock,
      miscTriggerResizeMock,
    ];

    beforeEach(async () => {
      vi.useFakeTimers();
      mocks.forEach((it) => it.mockClear());

      vi.mock("../../src/ts/test/test-state", () => ({
        isActive: true,
      }));

      isConfigValueValidMock.mockReturnValue(true);
      canSetConfigWithCurrentFunboxesMock.mockReturnValue(true);
      dbSaveConfigMock.mockResolvedValue();

      replaceConfig({});
    });

    afterAll(() => {
      mocks.forEach((it) => it.mockRestore());
      vi.useRealTimers();
    });

    beforeEach(() => isDevEnvironmentMock.mockClear());

    it("should throw if config key in not found in metadata", () => {
      expect(() => {
        Config.setConfig("nonExistentKey" as ConfigKey, true);
      }).toThrowError(
        `Config metadata for key "nonExistentKey" is not defined.`,
      );
    });

    it("fails if test is active and funbox no_quit", () => {
      //GIVEN
      replaceConfig({ funbox: ["no_quit"], numbers: false });

      //WHEN
      expect(Config.setConfig("numbers", true, true)).toBe(false);

      //THEN
      expect(notificationAddMock).toHaveBeenCalledWith(
        "No quit funbox is active. Please finish the test.",
        0,
        {
          important: true,
        },
      );
    });

    //TODO isBlocked
    it("should fail if config is blocked", () => {
      //GIVEN
      replaceConfig({ tapeMode: "letter" });

      //WHEN / THEN
      expect(Config.setConfig("showAllLines", true)).toBe(false);
    });

    it("should use overrideValue", () => {
      //WHEN
      Config.setConfig("customLayoutfluid", ["3l", "ABNT2", "3l"]);

      //THEN
      expect(getConfig().customLayoutfluid).toEqual(["3l", "ABNT2"]);
    });

    it("fails if config is invalid", () => {
      //GIVEN
      isConfigValueValidMock.mockReturnValue(false);

      //WHEN / THEN
      expect(Config.setConfig("caretStyle", "banana" as any)).toBe(false);
      expect(isConfigValueValidMock).toHaveBeenCalledWith(
        "caret style",
        "banana",
        CaretStyleSchema,
      );
    });

    it("cannot set if funbox disallows", () => {
      //GIVEN
      canSetConfigWithCurrentFunboxesMock.mockReturnValue(false);

      //WHEN / THEN
      expect(Config.setConfig("numbers", true)).toBe(false);
    });

    it("sets overrideConfigs", () => {
      //GIVEN
      replaceConfig({
        confidenceMode: "off",
        freedomMode: false, //already set correctly
        stopOnError: "letter", //should get updated
      });

      //WHEN
      Config.setConfig("confidenceMode", "max");

      //THEN
      expect(dispatchConfigEventMock).not.toHaveBeenCalledWith(
        "freedomMode",
        false,
        true,
        true,
      );

      expect(dispatchConfigEventMock).toHaveBeenCalledWith(
        "stopOnError",
        "off",
        false,
        "letter",
      );

      expect(dispatchConfigEventMock).toHaveBeenCalledWith(
        "confidenceMode",
        "max",
        false,
        "off",
      );
    });

    it("saves to localstorage if nosave=false", async () => {
      //GIVEN
      replaceConfig({ numbers: false });

      //WHEN
      Config.setConfig("numbers", true);

      //THEN
      //wait for debounce
      await vi.advanceTimersByTimeAsync(2500);

      //show loading
      expect(accountButtonLoadingMock).toHaveBeenNthCalledWith(1, true);

      //save
      expect(dbSaveConfigMock).toHaveBeenCalledWith({ numbers: true });

      //hide loading
      expect(accountButtonLoadingMock).toHaveBeenNthCalledWith(2, false);

      //send event
      expect(dispatchConfigEventMock).toHaveBeenCalledWith(
        "saveToLocalStorage",
        expect.stringContaining("numbers"),
      );
    });

    it("saves configOverride values to localstorage if nosave=false", async () => {
      //GIVEN
      replaceConfig({});

      //WHEN
      Config.setConfig("minWpmCustomSpeed", 120);

      //THEN
      //wait for debounce
      await vi.advanceTimersByTimeAsync(2500);

      //save
      expect(dbSaveConfigMock).toHaveBeenCalledWith({
        minWpmCustomSpeed: 120,
        minWpm: "custom",
      });

      //send event
      expect(dispatchConfigEventMock).toHaveBeenCalledWith(
        "saveToLocalStorage",
        expect.stringContaining("minWpmCustomSpeed"),
      );
      expect(dispatchConfigEventMock).toHaveBeenCalledWith(
        "saveToLocalStorage",
        expect.stringContaining("minWpm"),
      );
    });

    it("does not save to localstorage if nosave=true", async () => {
      //GIVEN

      replaceConfig({ numbers: false });

      //WHEN
      Config.setConfig("numbers", true, true);

      //THEN
      //wait for debounce
      await vi.advanceTimersByTimeAsync(2500);

      expect(accountButtonLoadingMock).not.toHaveBeenCalled();
      expect(dbSaveConfigMock).not.toHaveBeenCalled();

      expect(dispatchConfigEventMock).not.toHaveBeenCalledWith(
        "saveToLocalStorage",
        expect.any(String),
      );
    });

    it("dispatches event on set", () => {
      //GIVEN
      replaceConfig({ numbers: false });

      //WHEN
      Config.setConfig("numbers", true, true);

      //THEN

      expect(dispatchConfigEventMock).toHaveBeenCalledWith(
        "numbers",
        true,
        true,
        false,
      );
    });

    it("triggers resize if property is set", () => {
      ///WHEN
      Config.setConfig("maxLineWidth", 50, false);

      expect(miscTriggerResizeMock).toHaveBeenCalled();
    });

    it("does not triggers resize if property is not set", () => {
      ///WHEN
      Config.setConfig("startGraphsAtZero", true, false);

      expect(miscTriggerResizeMock).not.toHaveBeenCalled();
    });

    it("does not triggers resize if property on nosave", () => {
      ///WHEN
      Config.setConfig("maxLineWidth", 50, true);

      expect(miscTriggerResizeMock).not.toHaveBeenCalled();
    });

    it("calls afterSet", () => {
      //GIVEN
      isDevEnvironmentMock.mockReturnValue(false);
      replaceConfig({ ads: "off" });

      //WHEN
      Config.setConfig("ads", "sellout");

      //THEN
      expect(notificationAddMock).toHaveBeenCalledWith(
        "Ad settings changed. Refreshing...",
        0,
      );
      expect(miscReloadAfterMock).toHaveBeenCalledWith(3);
    });
  });

  //TODO move the rest to schema/tests or remove after removing the setX functions from Config
  it("setSmoothCaret", () => {
    expect(Config.setSmoothCaret("fast")).toBe(true);
    expect(Config.setSmoothCaret("medium")).toBe(true);
    expect(Config.setSmoothCaret("invalid" as any)).toBe(false);
  });
  it("setCodeUnindentOnBackspace", () => {
    testBoolean(Config.setCodeUnindentOnBackspace);
  });
  it("setQuickRestartMode", () => {
    expect(Config.setQuickRestartMode("off")).toBe(true);
    expect(Config.setQuickRestartMode("tab")).toBe(true);
    expect(Config.setQuickRestartMode("invalid" as any)).toBe(false);
  });
  it("setConfidenceMode", () => {
    expect(Config.setConfidenceMode("max")).toBe(true);
    expect(Config.setConfidenceMode("on")).toBe(true);
    expect(Config.setConfidenceMode("invalid" as any)).toBe(false);
  });
  it("setIndicateTypos", () => {
    expect(Config.setIndicateTypos("below")).toBe(true);
    expect(Config.setIndicateTypos("off")).toBe(true);
    expect(Config.setIndicateTypos("invalid" as any)).toBe(false);
  });
  it("setRandomTheme", () => {
    expect(Config.setRandomTheme("fav")).toBe(true);
    expect(Config.setRandomTheme("off")).toBe(true);
    expect(Config.setRandomTheme("invalid" as any)).toBe(false);
  });
  it("setKeymapMode", () => {
    expect(Config.setKeymapMode("next")).toBe(true);
    expect(Config.setKeymapMode("react")).toBe(true);
    expect(Config.setKeymapMode("invalid" as any)).toBe(false);
  });
  it("setKeymapLegendStyle", () => {
    expect(Config.setKeymapLegendStyle("blank")).toBe(true);
    expect(Config.setKeymapLegendStyle("lowercase")).toBe(true);
    expect(Config.setKeymapLegendStyle("invalid" as any)).toBe(false);
  });
  it("setKeymapStyle", () => {
    expect(Config.setKeymapStyle("matrix")).toBe(true);
    expect(Config.setKeymapStyle("split")).toBe(true);
    expect(Config.setKeymapStyle("invalid" as any)).toBe(false);
  });
  it("setKeymapShowTopRow", () => {
    expect(Config.setKeymapShowTopRow("always")).toBe(true);
    expect(Config.setKeymapShowTopRow("never")).toBe(true);
    expect(Config.setKeymapShowTopRow("invalid" as any)).toBe(false);
  });
  it("setKeymapSize", () => {
    expect(Config.setKeymapSize(0.5)).toBe(true);
    expect(Config.setKeymapSize(2)).toBe(true);
    expect(Config.setKeymapSize(3.5)).toBe(true);
    expect(Config.setKeymapSize("invalid" as any)).toBe(false);

    //invalid values being  "auto-fixed"
    expect(Config.setKeymapSize(0)).toBe(true);
    expect(getConfig().keymapSize).toBe(0.5);
    expect(Config.setKeymapSize(4)).toBe(true);
    expect(getConfig().keymapSize).toBe(3.5);
    expect(Config.setKeymapSize(1.25)).toBe(true);
    expect(getConfig().keymapSize).toBe(1.3);
    expect(Config.setKeymapSize(1.24)).toBe(true);
    expect(getConfig().keymapSize).toBe(1.2);
  });
  it("setCustomBackgroundSize", () => {
    expect(Config.setCustomBackgroundSize("contain")).toBe(true);
    expect(Config.setCustomBackgroundSize("cover")).toBe(true);
    expect(Config.setCustomBackgroundSize("invalid" as any)).toBe(false);
  });
  it("setCustomBackgroundFilter", () => {
    expect(Config.setCustomBackgroundFilter([0, 1, 2, 3])).toBe(true);

    expect(Config.setCustomBackgroundFilter([0, 1, 2, 3, 4] as any)).toBe(
      false,
    );
    expect(Config.setCustomBackgroundFilter([] as any)).toBe(false);
    expect(Config.setCustomBackgroundFilter(["invalid"] as any)).toBe(false);
    expect(Config.setCustomBackgroundFilter([1, 2, 3, 4, 5, 6] as any)).toBe(
      false,
    );
  });
  it("setMonkeyPowerLevel", () => {
    expect(Config.setMonkeyPowerLevel("2")).toBe(true);
    expect(Config.setMonkeyPowerLevel("off")).toBe(true);

    expect(Config.setMonkeyPowerLevel("invalid" as any)).toBe(false);
  });
  it("setCustomThemeColors", () => {
    expect(Config.setCustomThemeColors(customThemeColors(10))).toBe(true);

    expect(Config.setCustomThemeColors(customThemeColors(9))).toBe(false);
    expect(Config.setCustomThemeColors(customThemeColors(5))).toBe(false);
    expect(Config.setCustomThemeColors(customThemeColors(11))).toBe(false);

    const tenColors = customThemeColors(10);
    tenColors[0] = "black";
    expect(Config.setCustomThemeColors(tenColors)).toBe(false);
    tenColors[0] = "#123456";
    expect(Config.setCustomThemeColors(tenColors)).toBe(true);
    tenColors[0] = "#1234";
    expect(Config.setCustomThemeColors(tenColors)).toBe(false);
  });
  it("setStartGraphsAtZero", () => {
    testBoolean(Config.setStartGraphsAtZero);
  });
  it("setSmoothLineScroll", () => {
    testBoolean(Config.setSmoothLineScroll);
  });
  it("setFreedomMode", () => {
    testBoolean(Config.setFreedomMode);
  });
  it("setAutoSwitchTheme", () => {
    testBoolean(Config.setAutoSwitchTheme);
  });
  it("setCustomTheme", () => {
    testBoolean(Config.setCustomTheme);
  });
  it("setBritishEnglish", () => {
    testBoolean(Config.setBritishEnglish);
  });
  it("setLazyMode", () => {
    testBoolean(Config.setLazyMode);
  });
  it("setMonkey", () => {
    testBoolean(Config.setMonkey);
  });
  it("setBurstHeatmap", () => {
    testBoolean(Config.setBurstHeatmap);
  });
  it("setTimeConfig", () => {
    expect(Config.setConfig("time", 0)).toBe(true);
    expect(Config.setConfig("time", 1)).toBe(true);

    expect(Config.setConfig("time", 11.11)).toBe(false);
  });
  it("setWordCount", () => {
    expect(Config.setWordCount(0)).toBe(true);
    expect(Config.setWordCount(1)).toBe(true);

    expect(Config.setWordCount("invalid" as any)).toBe(false);
    expect(Config.setWordCount(11.11)).toBe(false);
  });
  it("setFontFamily", () => {
    expect(Config.setFontFamily("Arial")).toBe(true);
    expect(Config.setFontFamily("roboto_mono")).toBe(true);
    expect(Config.setFontFamily("test_font")).toBe(true);
    expect(Config.setFontFamily(stringOfLength(50))).toBe(true);

    expect(Config.setFontFamily(stringOfLength(51))).toBe(false);
    expect(Config.setFontFamily("test font")).toBe(false);
    expect(Config.setFontFamily("test!font")).toBe(false);
  });
  it("setTheme", () => {
    expect(Config.setTheme("serika")).toBe(true);
    expect(Config.setTheme("serika_dark")).toBe(true);

    expect(Config.setTheme("invalid" as any)).toBe(false);
  });
  it("setThemeLight", () => {
    expect(Config.setThemeLight("serika")).toBe(true);
    expect(Config.setThemeLight("serika_dark")).toBe(true);

    expect(Config.setThemeLight("invalid" as any)).toBe(false);
  });
  it("setThemeDark", () => {
    expect(Config.setThemeDark("serika")).toBe(true);
    expect(Config.setThemeDark("serika_dark")).toBe(true);

    expect(Config.setThemeDark("invalid" as any)).toBe(false);
  });
  it("setLanguage", () => {
    expect(Config.setLanguage("english")).toBe(true);
    expect(Config.setLanguage("english_1k")).toBe(true);

    expect(Config.setLanguage("invalid" as any)).toBe(false);
  });
  it("setKeymapLayout", () => {
    expect(Config.setKeymapLayout("overrideSync")).toBe(true);
    expect(Config.setKeymapLayout("override_sync" as any)).toBe(false);
    expect(Config.setKeymapLayout("override sync" as any)).toBe(false);
    expect(Config.setKeymapLayout("override-sync!" as any)).toBe(false);
  });
  it("setLayout", () => {
    expect(Config.setLayout("semimak")).toBe(true);
    expect(Config.setLayout("default")).toBe(true);
    expect(Config.setLayout("semi_mak" as any)).toBe(false);
    expect(Config.setLayout("overrideSync" as any)).toBe(false);
  });
  it("setFontSize", () => {
    expect(Config.setFontSize(1)).toBe(true);

    expect(Config.setFontSize(0)).toBe(false);
    expect(Config.setFontSize("5" as any)).toBe(false);
    expect(Config.setFontSize("invalid" as any)).toBe(false);
  });
  it("setMaxLineWidth", () => {
    expect(Config.setMaxLineWidth(0)).toBe(true);
    expect(Config.setMaxLineWidth(50)).toBe(true);
    expect(Config.setMaxLineWidth(50.5)).toBe(true);
  });
  it("setCustomBackground", () => {
    expect(Config.setCustomBackground("http://example.com/test.png")).toBe(
      true,
    );
    expect(Config.setCustomBackground("https://www.example.com/test.gif")).toBe(
      true,
    );
    expect(Config.setCustomBackground("https://example.com/test.jpg")).toBe(
      true,
    );
    expect(Config.setCustomBackground("http://www.example.com/test.jpeg")).toBe(
      true,
    );

    //gets converted
    expect(
      Config.setCustomBackground("     http://example.com/test.png   "),
    ).toBe(true);

    expect(Config.setCustomBackground("http://www.example.com/test.tiff")).toBe(
      false,
    );
    expect(
      Config.setCustomBackground(
        "http://www.example.com/test?test=foo&bar=baz",
      ),
    ).toBe(false);
    expect(Config.setCustomBackground("invalid")).toBe(false);
  });
  it("setQuoteLength", () => {
    expect(Config.setQuoteLength([0])).toBe(true);
    expect(Config.setQuoteLength([-3])).toBe(true);
    expect(Config.setQuoteLength([3])).toBe(true);

    expect(Config.setQuoteLength(-4 as any)).toBe(false);
    expect(Config.setQuoteLength(4 as any)).toBe(false);
    expect(Config.setQuoteLength(3 as any)).toBe(false);
    expect(Config.setQuoteLength(2 as any)).toBe(false);

    expect(Config.setQuoteLength([0, -3, 2])).toBe(true);

    expect(Config.setQuoteLength([-4 as any, 5 as any])).toBe(false);
  });
  it("setCustomLayoutfluid", () => {
    expect(Config.setCustomLayoutfluid(["qwerty", "qwertz"])).toBe(true);

    expect(Config.setCustomLayoutfluid(["qwerty"])).toBe(false);
    expect(Config.setCustomLayoutfluid([])).toBe(false);
    expect(Config.setCustomLayoutfluid("qwerty#qwertz" as any)).toBe(false);
    expect(Config.setCustomLayoutfluid("invalid" as any)).toBe(false);
  });

  describe("apply", () => {
    it("should fill missing values with defaults", async () => {
      //GIVEN
      replaceConfig({
        mode: "words",
      });
      await Config.apply({
        numbers: true,
        punctuation: true,
      });
      const config = getConfig();
      expect(config.mode).toBe("time");
      expect(config.numbers).toBe(true);
      expect(config.punctuation).toBe(true);
    });

    describe("should reset to default if setting failed", () => {
      const testCases: {
        display: string;
        value: Partial<ConfigType>;
        expected: Partial<ConfigType>;
      }[] = [
        {
          // invalid funbox
          display: "invalid funbox",
          value: { funbox: ["invalid_funbox"] as any },
          expected: { funbox: [] },
        },
        {
          display: "mode incompatible with funbox",
          value: { mode: "quote", funbox: ["58008"] },
          expected: { funbox: [] },
        },
        {
          display: "invalid combination of funboxes",
          value: { funbox: ["58008", "gibberish"] },
          expected: { funbox: [] },
        },
        {
          display: "sanitizes config, remove extra keys",
          value: { mode: "zen", unknownKey: true, unknownArray: [1, 2] } as any,
          expected: { mode: "zen" },
        },
        {
          display: "applies config migration",
          value: { mode: "zen", swapEscAndTab: true } as any,
          expected: { mode: "zen", quickRestart: "esc" },
        },
      ];

      it.each(testCases)("$display", async ({ value, expected }) => {
        await Config.apply(value);

        const config = getConfig();
        const applied = Object.fromEntries(
          Object.entries(config).filter(([key]) =>
            Object.keys(expected).includes(key),
          ),
        );
        expect(applied).toEqual(expected);
      });
    });

    describe("should apply keys in an order to avoid overrides", () => {
      const testCases: {
        display: string;
        value: Partial<ConfigType>;
        expected: Partial<ConfigType>;
      }[] = [
        {
          display:
            "quote length shouldnt override mode, punctuation and numbers",
          value: {
            punctuation: true,
            numbers: true,
            quoteLength: [0],
            mode: "time",
          },
          expected: {
            punctuation: true,
            numbers: true,
            quoteLength: [0],
            mode: "time",
          },
        },
      ];

      it.each(testCases)("$display", async ({ value, expected }) => {
        await Config.apply(value);
        const config = getConfig();
        const applied = Object.fromEntries(
          Object.entries(config).filter(([key]) =>
            Object.keys(expected).includes(key),
          ),
        );
        expect(applied).toEqual(expected);
      });
    });

    it("should apply a partial config but keep the rest unchanged", async () => {
      replaceConfig({
        numbers: true,
      });
      await Config.apply({
        ...Config.getConfigChanges(),
        punctuation: true,
      });
      const config = getConfig();
      expect(config.numbers).toBe(true);
    });

    it("should not enable minWpm if not provided", async () => {
      replaceConfig({
        minWpm: "off",
      });
      await Config.apply({
        minWpmCustomSpeed: 100,
      });
      const config = getConfig();
      expect(config.minWpm).toBe("off");
      expect(config.minWpmCustomSpeed).toEqual(100);
    });

    it("should apply minWpm if part of the full config", async () => {
      replaceConfig({
        minWpm: "off",
      });
      await Config.apply({
        minWpm: "custom",
        minWpmCustomSpeed: 100,
      });
      const config = getConfig();
      expect(config.minWpm).toBe("custom");
      expect(config.minWpmCustomSpeed).toEqual(100);
    });

    it("should keep the keymap off when applying keymapLayout", async () => {
      replaceConfig({});
      await Config.apply({
        keymapLayout: "qwerty",
      });
      const config = getConfig();
      expect(config.keymapLayout).toEqual("qwerty");
      expect(config.keymapMode).toEqual("off");
    });
  });
});

function customThemeColors(n: number): CustomThemeColors {
  const arr = new Array(n).fill("#000") as CustomThemeColors;
  arr[0] = "#123456"; // we have a protection against all colors being the same
  return arr;
}

function testBoolean(fn: (val: boolean) => boolean): void {
  expect(fn(true)).toBe(true);
  expect(fn(false)).toBe(true);

  expect(fn("true" as any)).toBe(false);
  expect(fn("0" as any)).toBe(false);
  expect(fn("invalid" as any)).toBe(false);
}

function stringOfLength(length: number): string {
  return randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}
