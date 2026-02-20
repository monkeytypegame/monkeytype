import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import * as Config from "../../src/ts/config";
import * as Misc from "../../src/ts/utils/misc";
import {
  ConfigKey,
  Config as ConfigType,
  CaretStyleSchema,
} from "@monkeytype/schemas/configs";
import * as FunboxValidation from "../../src/ts/test/funbox/funbox-validation";
import * as ConfigValidation from "../../src/ts/config-validation";
import * as ConfigEvent from "../../src/ts/observables/config-event";
import * as ApeConfig from "../../src/ts/ape/config";
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
    const dbSaveConfigMock = vi.spyOn(ApeConfig, "saveConfig");
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
      expect(
        Config.setConfig("numbers", true, {
          nosave: true,
        }),
      ).toBe(false);

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
      expect(dispatchConfigEventMock).not.toHaveBeenCalledWith({
        key: "freedomMode",
        newValue: false,
        nosave: true,
        previousValue: true,
      });

      expect(dispatchConfigEventMock).toHaveBeenCalledWith({
        key: "stopOnError",
        newValue: "off",
        nosave: false,
        previousValue: "letter",
      });

      expect(dispatchConfigEventMock).toHaveBeenCalledWith({
        key: "confidenceMode",
        newValue: "max",
        nosave: false,
        previousValue: "off",
      });
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
    });

    it("does not save to localstorage if nosave=true", async () => {
      //GIVEN

      replaceConfig({ numbers: false });

      //WHEN
      Config.setConfig("numbers", true, {
        nosave: true,
      });

      //THEN
      //wait for debounce
      await vi.advanceTimersByTimeAsync(2500);

      expect(accountButtonLoadingMock).not.toHaveBeenCalled();
      expect(dbSaveConfigMock).not.toHaveBeenCalled();
    });

    it("dispatches event on set", () => {
      //GIVEN
      replaceConfig({ numbers: false });

      //WHEN
      Config.setConfig("numbers", true, {
        nosave: true,
      });

      //THEN

      expect(dispatchConfigEventMock).toHaveBeenCalledWith({
        key: "numbers",
        newValue: true,
        nosave: true,
        previousValue: false,
      });
    });

    it("triggers resize if property is set", () => {
      ///WHEN
      Config.setConfig("maxLineWidth", 50);

      expect(miscTriggerResizeMock).toHaveBeenCalled();
    });

    it("does not triggers resize if property is not set", () => {
      ///WHEN
      Config.setConfig("startGraphsAtZero", true);

      expect(miscTriggerResizeMock).not.toHaveBeenCalled();
    });

    it("does not triggers resize if property on nosave", () => {
      ///WHEN
      Config.setConfig("maxLineWidth", 50, { nosave: true });

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

  describe("apply", () => {
    it("should fill missing values with defaults", async () => {
      //GIVEN
      replaceConfig({
        mode: "words",
      });
      await Config.applyConfig({
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
        await Config.applyConfig(value);

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
        await Config.applyConfig(value);
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
      await Config.applyConfig({
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
      await Config.applyConfig({
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
      await Config.applyConfig({
        minWpm: "custom",
        minWpmCustomSpeed: 100,
      });
      const config = getConfig();
      expect(config.minWpm).toBe("custom");
      expect(config.minWpmCustomSpeed).toEqual(100);
    });

    it("should keep the keymap off when applying keymapLayout", async () => {
      replaceConfig({});
      await Config.applyConfig({
        keymapLayout: "qwerty",
      });
      const config = getConfig();
      expect(config.keymapLayout).toEqual("qwerty");
      expect(config.keymapMode).toEqual("off");
    });
  });
});
