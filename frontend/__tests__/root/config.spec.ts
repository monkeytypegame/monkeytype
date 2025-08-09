import * as Config from "../../src/ts/config";
import * as Misc from "../../src/ts/utils/misc";
import {
  CustomThemeColors,
  ConfigKey,
  Config as ConfigType,
  CaretStyleSchema,
} from "@monkeytype/schemas/configs";
import { randomBytes } from "crypto";
import { vi } from "vitest";
import * as FunboxValidation from "../../src/ts/test/funbox/funbox-validation";
import * as ConfigValidation from "../../src/ts/config-validation";
import * as ConfigEvent from "../../src/ts/observables/config-event";
import * as DB from "../../src/ts/db";
import * as AccountButton from "../../src/ts/elements/account-button";
import * as Notifications from "../../src/ts/elements/notifications";

type TestsByConfig<T> = Partial<{
  [K in keyof ConfigType]: (T & { value: ConfigType[K] })[];
}>;

const { configMetadata, replaceConfig, getConfig } = Config.__testing;

describe("Config", () => {
  const isDevEnvironmentMock = vi.spyOn(Misc, "isDevEnvironment");
  beforeEach(() => {
    isDevEnvironmentMock.mockClear();
    replaceConfig({});
  });

  describe("configMeta", () => {
    afterAll(() => {
      replaceConfig({});
      vi.resetModules();
    });
    it("should have changeRequiresRestart defined", () => {
      const configsRequiringRestarts = Object.entries(configMetadata)
        .filter(([_key, value]) => value.changeRequiresRestart === true)
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
        ].sort()
      );
    });

    it("should have triggerResize defined", () => {
      const configsWithTriggeResize = Object.entries(configMetadata)
        .filter(([_key, value]) => value.triggerResize === true)
        .map(([key]) => key)
        .sort();

      expect(configsWithTriggeResize).toEqual(
        ["fontSize", "keymapSize", "maxLineWidth", "tapeMode"].sort()
      );
    });

    it("should throw if config key in not found in metadata", () => {
      expect(() => {
        Config.genericSet("nonExistentKey" as ConfigKey, true);
      }).toThrowError(
        `Config metadata for key "nonExistentKey" is not defined.`
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
          value.flatMap((it) => ({ key: key as ConfigKey, ...it }))
        )
      )(
        `$key value=$value given=$given expect=$expected`,
        ({ key, value, given, expected }) => {
          //GIVEN
          replaceConfig(given ?? {});

          //WHEN
          Config.genericSet(key, value as any);

          //THEN
          expect(getConfig()).toMatchObject(expected);
        }
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
          value.flatMap((it) => ({ key: key as ConfigKey, ...it }))
        )
      )(
        `$key value=$value given=$given fail=$fail`,
        ({ key, value, given, fail }) => {
          //GIVEN
          replaceConfig(given ?? {});

          //WHEN
          const applied = Config.genericSet(key, value as any);

          //THEN
          expect(applied).toEqual(!fail);
        }
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
          value.flatMap((it) => ({ key: key as ConfigKey, ...it }))
        )
      )(
        `$key value=$value given=$given expected=$expected`,
        ({ key, value, given, expected }) => {
          //GIVEN
          replaceConfig(given);

          //WHEN
          Config.genericSet(key, value as any);

          //THEN
          expect(getConfig()).toMatchObject(expected ?? {});
        }
      );
    });

    describe("test with mocks", () => {
      const canSetConfigWithCurrentFunboxesMock = vi.spyOn(
        FunboxValidation,
        "canSetConfigWithCurrentFunboxes"
      );
      const isConfigValueValidMock = vi.spyOn(
        ConfigValidation,
        "isConfigValueValid"
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
          Config.genericSet("nonExistentKey" as ConfigKey, true);
        }).toThrowError(
          `Config metadata for key "nonExistentKey" is not defined.`
        );
      });

      it("fails if test is active and funbox no_quit", () => {
        //GIVEN
        replaceConfig({ funbox: ["no_quit"], numbers: false });

        //WHEN
        expect(Config.genericSet("numbers", true, true)).toBe(false);

        //THEN
        expect(notificationAddMock).toHaveBeenCalledWith(
          "No quit funbox is active. Please finish the test.",
          0,
          {
            important: true,
          }
        );
      });

      //TODO isBlocked
      it("should fail if config is blocked", () => {
        //GIVEN
        replaceConfig({ tapeMode: "letter" });

        //WHEN / THEN
        expect(Config.genericSet("showAllLines", true)).toBe(false);
      });

      it("should use overrideValue", () => {
        //WHEN
        Config.genericSet("customLayoutfluid", ["3l", "ABNT2", "3l"]);

        //THEN
        expect(getConfig().customLayoutfluid).toEqual(["3l", "ABNT2"]);
      });

      it("fails if config is invalid", () => {
        //GIVEN
        isConfigValueValidMock.mockReturnValue(false);

        //WHEN / THEN
        expect(Config.genericSet("caretStyle", "banana" as any)).toBe(false);
        expect(isConfigValueValidMock).toHaveBeenCalledWith(
          "caret style",
          "banana",
          CaretStyleSchema
        );
      });

      it("cannot set if funbox disallows", () => {
        //GIVEN
        canSetConfigWithCurrentFunboxesMock.mockReturnValue(false);

        //WHEN / THEN
        expect(Config.genericSet("numbers", true)).toBe(false);
      });

      it("sets overrideConfigs", () => {
        //GIVEN
        replaceConfig({
          confidenceMode: "off",
          freedomMode: false, //already set correctly
          stopOnError: "letter", //should get updated
        });

        //WHEN
        Config.genericSet("confidenceMode", "max");

        //THEN
        expect(dispatchConfigEventMock).not.toHaveBeenCalledWith(
          "freedomMode",
          false,
          true,
          true
        );

        expect(dispatchConfigEventMock).toHaveBeenCalledWith(
          "stopOnError",
          "off",
          true,
          "letter"
        );

        expect(dispatchConfigEventMock).toHaveBeenCalledWith(
          "confidenceMode",
          "max",
          false,
          "off"
        );
      });

      it("saves to localstorage if nosave=false", async () => {
        //GIVEN
        replaceConfig({ numbers: false });

        //WHEN
        Config.genericSet("numbers", true);

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
          expect.stringContaining("numbers")
        );
      });
      it("does not save to localstorage if nosave=true", async () => {
        //GIVEN

        replaceConfig({ numbers: false });

        //WHEN
        Config.genericSet("numbers", true, true);

        //THEN
        //wait for debounce
        await vi.advanceTimersByTimeAsync(2500);

        expect(accountButtonLoadingMock).not.toHaveBeenCalled();
        expect(dbSaveConfigMock).not.toHaveBeenCalled();

        expect(dispatchConfigEventMock).not.toHaveBeenCalledWith(
          "saveToLocalStorage",
          expect.any(String)
        );
      });

      it("dispatches event on set", () => {
        //GIVEN
        replaceConfig({ numbers: false });

        //WHEN
        Config.genericSet("numbers", true, true);

        //THEN

        expect(dispatchConfigEventMock).toHaveBeenCalledWith(
          "numbers",
          true,
          true,
          false
        );
      });

      it("triggers resize if property is set", () => {
        ///WHEN
        Config.genericSet("maxLineWidth", 50, false);

        expect(miscTriggerResizeMock).toHaveBeenCalled();
      });

      it("does not triggers resize if property is not set", () => {
        ///WHEN
        Config.genericSet("startGraphsAtZero", true, false);

        expect(miscTriggerResizeMock).not.toHaveBeenCalled();
      });

      it("does not triggers resize if property on nosave", () => {
        ///WHEN
        Config.genericSet("maxLineWidth", 50, true);

        expect(miscTriggerResizeMock).not.toHaveBeenCalled();
      });

      it("calls afterSet", () => {
        //GIVEN
        isDevEnvironmentMock.mockReturnValue(false);
        replaceConfig({ ads: "off" });

        //WHEN
        Config.genericSet("ads", "sellout");

        //THEN
        expect(notificationAddMock).toHaveBeenCalledWith(
          "Ad settings changed. Refreshing...",
          0
        );
        expect(miscReloadAfterMock).toHaveBeenCalledWith(3);
      });
    });
  });

  //TODO move the rest to schema/tests or remove after removing the setX functions from Config
  it("setMode", () => {
    expect(Config.setMode("zen")).toBe(true);
    expect(Config.setMode("invalid" as any)).toBe(false);
  });
  it("setPlaySoundOnError", () => {
    expect(Config.setPlaySoundOnError("off")).toBe(true);
    expect(Config.setPlaySoundOnError("1")).toBe(true);
    expect(Config.setPlaySoundOnError("invalid" as any)).toBe(false);
  });
  it("setPlaySoundOnClick", () => {
    expect(Config.setPlaySoundOnClick("off")).toBe(true);
    expect(Config.setPlaySoundOnClick("15")).toBe(true);
    expect(Config.setPlaySoundOnClick("invalid" as any)).toBe(false);
  });
  it("setSoundVolume", () => {
    expect(Config.setSoundVolume(0.1)).toBe(true);
    expect(Config.setSoundVolume(1.0)).toBe(true);
    expect(Config.setSoundVolume("invalid" as any)).toBe(false);
  });
  it("setDifficulty", () => {
    expect(Config.setDifficulty("expert")).toBe(true);
    expect(Config.setDifficulty("invalid" as any)).toBe(false);
  });
  it("setAccountChart", () => {
    expect(Config.setAccountChart(["on", "off", "off", "on"])).toBe(true);
    //arrays not having 4 values will get [on, on, on, on] as default
    expect(Config.setAccountChart(["on", "off"] as any)).toBe(false);
    expect(Config.setAccountChart(["on", "off", "on", "true"] as any)).toBe(
      false
    );
  });
  it("setStopOnError", () => {
    expect(Config.setStopOnError("off")).toBe(true);
    expect(Config.setStopOnError("word")).toBe(true);
    expect(Config.setStopOnError("invalid" as any)).toBe(false);
  });
  it("setTypingSpeedUnit", () => {
    expect(Config.setTypingSpeedUnit("wpm")).toBe(true);
    expect(Config.setTypingSpeedUnit("cpm")).toBe(true);
    expect(Config.setTypingSpeedUnit("invalid" as any)).toBe(false);
  });
  it("setPaceCaret", () => {
    expect(Config.setPaceCaret("average")).toBe(true);
    expect(Config.setPaceCaret("last")).toBe(true);
    expect(Config.setPaceCaret("invalid" as any)).toBe(false);
  });
  it("setMinWpm", () => {
    expect(Config.setMinWpm("custom")).toBe(true);
    expect(Config.setMinWpm("off")).toBe(true);
    expect(Config.setMinWpm("invalid" as any)).toBe(false);
  });
  it("setMinAcc", () => {
    expect(Config.setMinAcc("custom")).toBe(true);
    expect(Config.setMinAcc("off")).toBe(true);
    expect(Config.setMinAcc("invalid" as any)).toBe(false);
  });
  it("setMinBurst", () => {
    expect(Config.setMinBurst("fixed")).toBe(true);
    expect(Config.setMinBurst("off")).toBe(true);
    expect(Config.setMinBurst("invalid" as any)).toBe(false);
  });
  it("setSingleListCommandLine", () => {
    expect(Config.setSingleListCommandLine("on")).toBe(true);
    expect(Config.setSingleListCommandLine("manual")).toBe(true);
    expect(Config.setSingleListCommandLine("invalid" as any)).toBe(false);
  });
  it("setAds", () => {
    expect(Config.setAds("on")).toBe(true);
    expect(Config.setAds("sellout")).toBe(true);
  });
  it("setRepeatQuotes", () => {
    expect(Config.setRepeatQuotes("off")).toBe(true);
    expect(Config.setRepeatQuotes("typing")).toBe(true);
    expect(Config.setRepeatQuotes("invalid" as any)).toBe(false);
  });
  it("setOppositeShiftMode", () => {
    expect(Config.setOppositeShiftMode("on")).toBe(true);
    expect(Config.setOppositeShiftMode("keymap")).toBe(true);
    expect(Config.setOppositeShiftMode("invalid" as any)).toBe(false);
  });
  it("setCaretStyle", () => {
    expect(Config.setCaretStyle("banana")).toBe(true);
    expect(Config.setCaretStyle("block")).toBe(true);
    expect(Config.setCaretStyle("invalid" as any)).toBe(false);
  });
  it("setPaceCaretStyle", () => {
    expect(Config.setPaceCaretStyle("carrot")).toBe(true);
    expect(Config.setPaceCaretStyle("outline")).toBe(true);
    expect(Config.setPaceCaretStyle("invalid" as any)).toBe(false);
  });
  it("setShowAverage", () => {
    expect(Config.setShowAverage("acc")).toBe(true);
    expect(Config.setShowAverage("both")).toBe(true);
    expect(Config.setShowAverage("invalid" as any)).toBe(false);
  });
  it("setHighlightMode", () => {
    expect(Config.setHighlightMode("letter")).toBe(true);
    expect(Config.setHighlightMode("next_three_words")).toBe(true);
    expect(Config.setHighlightMode("invalid" as any)).toBe(false);
  });
  it("setTapeMode", () => {
    expect(Config.setTapeMode("letter")).toBe(true);
    expect(Config.setTapeMode("off")).toBe(true);
    expect(Config.setTapeMode("invalid" as any)).toBe(false);
  });
  it("setTimerStyle", () => {
    expect(Config.setTimerStyle("bar")).toBe(true);
    expect(Config.setTimerStyle("mini")).toBe(true);
    expect(Config.setTimerStyle("invalid" as any)).toBe(false);
  });
  it("setLiveSpeedStyle", () => {
    expect(Config.setLiveSpeedStyle("text")).toBe(true);
    expect(Config.setLiveSpeedStyle("mini")).toBe(true);
    expect(Config.setLiveSpeedStyle("invalid" as any)).toBe(false);
  });
  it("setLiveAccStyle", () => {
    expect(Config.setLiveAccStyle("text")).toBe(true);
    expect(Config.setLiveAccStyle("mini")).toBe(true);
    expect(Config.setLiveAccStyle("invalid" as any)).toBe(false);
  });
  it("setLiveBurstStyle", () => {
    expect(Config.setLiveBurstStyle("text")).toBe(true);
    expect(Config.setLiveBurstStyle("mini")).toBe(true);
    expect(Config.setLiveBurstStyle("invalid" as any)).toBe(false);
  });
  it("setTimerColor", () => {
    expect(Config.setTimerColor("text")).toBe(true);
    expect(Config.setTimerColor("sub")).toBe(true);
    expect(Config.setTimerColor("invalid" as any)).toBe(false);
  });
  it("setTimerOpacity", () => {
    expect(Config.setTimerOpacity("1")).toBe(true);
    expect(Config.setTimerOpacity("0.5")).toBe(true);
    expect(Config.setTimerOpacity("invalid" as any)).toBe(false);
  });
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
      false
    );
    expect(Config.setCustomBackgroundFilter([] as any)).toBe(false);
    expect(Config.setCustomBackgroundFilter(["invalid"] as any)).toBe(false);
    expect(Config.setCustomBackgroundFilter([1, 2, 3, 4, 5, 6] as any)).toBe(
      false
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
    expect(Config.setCustomThemeColors([] as any)).toBe(false);
    expect(Config.setCustomThemeColors(["invalid"] as any)).toBe(false);
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
  it("setNumbers", () => {
    testBoolean(Config.setNumbers);
  });
  it("setPunctuation", () => {
    testBoolean(Config.setPunctuation);
  });
  it("setBlindMode", () => {
    testBoolean(Config.setBlindMode);
  });
  it("setAccountChart", () => {
    expect(Config.setAccountChart(["on", "off", "off", "on"])).toBe(true);
    expect(Config.setAccountChart(["on", "off"] as any)).toBe(false);
    expect(Config.setAccountChart(["on", "off", "on", "true"] as any)).toBe(
      false
    );
  });
  it("setAlwaysShowDecimalPlaces", () => {
    testBoolean(Config.setAlwaysShowDecimalPlaces);
  });
  it("setShowOutOfFocusWarning", () => {
    testBoolean(Config.setShowOutOfFocusWarning);
  });
  it("setAlwaysShowWordsHistory", () => {
    testBoolean(Config.setAlwaysShowWordsHistory);
  });
  it("setCapsLockWarning", () => {
    testBoolean(Config.setCapsLockWarning);
  });
  it("setShowAllLines", () => {
    testBoolean(Config.setShowAllLines);
  });
  it("setQuickEnd", () => {
    testBoolean(Config.setQuickEnd);
  });
  it("setFlipTestColors", () => {
    testBoolean(Config.setFlipTestColors);
  });
  it("setColorfulMode", () => {
    testBoolean(Config.setColorfulMode);
  });
  it("setStrictSpace", () => {
    testBoolean(Config.setStrictSpace);
  });
  it("setHideExtraLetters", () => {
    testBoolean(Config.setHideExtraLetters);
  });
  it("setKeyTips", () => {
    testBoolean(Config.setKeyTips);
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
  it("setRepeatedPace", () => {
    testBoolean(Config.setRepeatedPace);
  });
  it("setFavThemes", () => {
    expect(Config.setFavThemes([])).toBe(true);
    expect(Config.setFavThemes(["8008", "80s_after_dark"])).toBe(true);
    expect(Config.setFavThemes(["test"] as any)).toBe(false);
    expect(Config.setFavThemes("invalid" as any)).toBe(false);
  });
  it("setFunbox", () => {
    expect(Config.setFunbox(["mirror"])).toBe(true);
    expect(Config.setFunbox(["mirror", "58008"])).toBe(true);
  });
  it("setPaceCaretCustomSpeed", () => {
    expect(Config.setPaceCaretCustomSpeed(0)).toBe(true);
    expect(Config.setPaceCaretCustomSpeed(1)).toBe(true);
    expect(Config.setPaceCaretCustomSpeed(11.11)).toBe(true);

    expect(Config.setPaceCaretCustomSpeed("invalid" as any)).toBe(false);
    expect(Config.setPaceCaretCustomSpeed(-1)).toBe(false);
  });
  it("setMinWpmCustomSpeed", () => {
    expect(Config.setMinWpmCustomSpeed(0)).toBe(true);
    expect(Config.setMinWpmCustomSpeed(1)).toBe(true);
    expect(Config.setMinWpmCustomSpeed(11.11)).toBe(true);

    expect(Config.setMinWpmCustomSpeed("invalid" as any)).toBe(false);
    expect(Config.setMinWpmCustomSpeed(-1)).toBe(false);
  });
  it("setMinAccCustom", () => {
    expect(Config.setMinAccCustom(0)).toBe(true);
    expect(Config.setMinAccCustom(1)).toBe(true);
    expect(Config.setMinAccCustom(11.11)).toBe(true);

    expect(Config.setMinAccCustom("invalid" as any)).toBe(false);
    expect(Config.setMinAccCustom(-1)).toBe(false);
  });
  it("setMinBurstCustomSpeed", () => {
    expect(Config.setMinBurstCustomSpeed(0)).toBe(true);
    expect(Config.setMinBurstCustomSpeed(1)).toBe(true);
    expect(Config.setMinBurstCustomSpeed(11.11)).toBe(true);

    expect(Config.setMinBurstCustomSpeed("invalid" as any)).toBe(false);
    expect(Config.setMinBurstCustomSpeed(-1)).toBe(false);
  });
  it("setTimeConfig", () => {
    expect(Config.setTimeConfig(0)).toBe(true);
    expect(Config.setTimeConfig(1)).toBe(true);

    expect(Config.setTimeConfig(11.11)).toBe(false);
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
      true
    );
    expect(Config.setCustomBackground("https://www.example.com/test.gif")).toBe(
      true
    );
    expect(Config.setCustomBackground("https://example.com/test.jpg")).toBe(
      true
    );
    expect(Config.setCustomBackground("http://www.example.com/test.jpeg")).toBe(
      true
    );

    //gets converted
    expect(
      Config.setCustomBackground("     http://example.com/test.png   ")
    ).toBe(true);

    expect(Config.setCustomBackground("http://www.example.com/test.webp")).toBe(
      false
    );
    expect(
      Config.setCustomBackground("http://www.example.com/test?test=foo&bar=baz")
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
            Object.keys(expected).includes(key)
          )
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
            Object.keys(expected).includes(key)
          )
        );
        expect(applied).toEqual(expected);
      });
    });

    it("should apply a partial config but keep the rest unchanged", async () => {
      replaceConfig({
        numbers: true,
      });
      await Config.apply({
        punctuation: true,
      });
      const config = getConfig();
      expect(config.numbers).toBe(true);
    });

    it("should reset all values to default if fullReset is true", async () => {
      replaceConfig({
        numbers: true,
        theme: "serika",
      });
      await Config.apply(
        {
          punctuation: true,
        },
        true
      );
      const config = getConfig();
      expect(config.numbers).toBe(false);
      expect(config.theme).toEqual("serika_dark");
    });
  });
});

function customThemeColors(n: number): CustomThemeColors {
  return new Array(n).fill("#000") as CustomThemeColors;
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
