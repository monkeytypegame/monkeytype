import * as Config from "../../src/ts/config";

import { CustomThemeColors } from "@monkeytype/contracts/schemas/configs";
import { randomBytes } from "crypto";

describe("Config", () => {
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
    expect(Config.setAccountChart(["on", "off"] as any)).toBe(true);
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
    expect(Config.setAds("invalid" as any)).toBe(false);
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
    expect(Config.default.keymapSize).toBe(0.5);
    expect(Config.setKeymapSize(4)).toBe(true);
    expect(Config.default.keymapSize).toBe(3.5);
    expect(Config.setKeymapSize(1.25)).toBe(true);
    expect(Config.default.keymapSize).toBe(1.3);
    expect(Config.setKeymapSize(1.24)).toBe(true);
    expect(Config.default.keymapSize).toBe(1.2);
  });
  it("setCustomBackgroundSize", () => {
    expect(Config.setCustomBackgroundSize("contain")).toBe(true);
    expect(Config.setCustomBackgroundSize("cover")).toBe(true);
    expect(Config.setCustomBackgroundSize("invalid" as any)).toBe(false);
  });
  it("setCustomBackgroundFilter", () => {
    expect(Config.setCustomBackgroundFilter([0, 1, 2, 3])).toBe(true);
    //gets converted
    expect(Config.setCustomBackgroundFilter([0, 1, 2, 3, 4] as any)).toBe(true);
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

    //gets converted
    expect(Config.setCustomThemeColors(customThemeColors(9))).toBe(true);

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
    expect(Config.setAccountChart(["on", "off"] as any)).toBe(true);
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
    expect(Config.setFavThemes(["test"])).toBe(true);
    expect(Config.setFavThemes([stringOfLength(50)])).toBe(true);

    expect(Config.setFavThemes("invalid" as any)).toBe(false);
    expect(Config.setFavThemes([stringOfLength(51)])).toBe(false);
  });
  it("setFunbox", () => {
    expect(Config.setFunbox("one")).toBe(true);
    expect(Config.setFunbox("one#two")).toBe(true);
    expect(Config.setFunbox("one#two#")).toBe(true);
    expect(Config.setFunbox(stringOfLength(100))).toBe(true);

    expect(Config.setFunbox(stringOfLength(101))).toBe(false);
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
    //gets converted
    expect(Config.setMinAccCustom(120)).toBe(true);

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

    //gets converted
    expect(Config.setTimeConfig("invalid" as any)).toBe(true);
    expect(Config.setTimeConfig(-1)).toBe(true);

    expect(Config.setTimeConfig(11.11)).toBe(false);
  });
  it("setWordCount", () => {
    expect(Config.setWordCount(0)).toBe(true);
    expect(Config.setWordCount(1)).toBe(true);

    //gets converted
    expect(Config.setWordCount(-1)).toBe(true);

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
    expect(Config.setTheme(stringOfLength(50))).toBe(true);

    expect(Config.setTheme("serika dark")).toBe(false);
    expect(Config.setTheme("serika-dark")).toBe(false);
    expect(Config.setTheme(stringOfLength(51))).toBe(false);
  });
  it("setThemeLight", () => {
    expect(Config.setThemeLight("serika")).toBe(true);
    expect(Config.setThemeLight("serika_dark")).toBe(true);
    expect(Config.setThemeLight(stringOfLength(50))).toBe(true);

    expect(Config.setThemeLight("serika dark")).toBe(false);
    expect(Config.setThemeLight("serika-dark")).toBe(false);
    expect(Config.setThemeLight(stringOfLength(51))).toBe(false);
  });
  it("setThemeDark", () => {
    expect(Config.setThemeDark("serika")).toBe(true);
    expect(Config.setThemeDark("serika_dark")).toBe(true);
    expect(Config.setThemeDark(stringOfLength(50))).toBe(true);

    expect(Config.setThemeDark("serika dark")).toBe(false);
    expect(Config.setThemeDark("serika-dark")).toBe(false);
    expect(Config.setThemeDark(stringOfLength(51))).toBe(false);
  });
  it("setLanguage", () => {
    expect(Config.setLanguage("english")).toBe(true);
    expect(Config.setLanguage("english_1k")).toBe(true);
    expect(Config.setLanguage(stringOfLength(50))).toBe(true);

    expect(Config.setLanguage("english 1k")).toBe(false);
    expect(Config.setLanguage("english-1k")).toBe(false);
    expect(Config.setLanguage(stringOfLength(51))).toBe(false);
  });
  it("setKeymapLayout", () => {
    expect(Config.setKeymapLayout("overrideSync")).toBe(true);
    expect(Config.setKeymapLayout("override_sync")).toBe(true);
    expect(Config.setKeymapLayout("override sync")).toBe(false);
    expect(Config.setKeymapLayout("override-sync!")).toBe(false);
    expect(Config.setKeymapLayout(stringOfLength(50))).toBe(true);

    expect(Config.setKeymapLayout(stringOfLength(51))).toBe(false);
  });
  it("setLayout", () => {
    expect(Config.setLayout("semimak")).toBe(true);
    expect(Config.setLayout("semi_mak")).toBe(true);
    expect(Config.setLayout(stringOfLength(50))).toBe(true);

    expect(Config.setLayout("semi mak")).toBe(false);
    expect(Config.setLayout("semi-mak")).toBe(true);
    expect(Config.setLayout(stringOfLength(51))).toBe(false);
  });
  it("setFontSize", () => {
    expect(Config.setFontSize(1)).toBe(true);

    //gets converted
    expect(Config.setFontSize(-1)).toBe(true);
    expect(Config.setFontSize("1" as any)).toBe(true);
    expect(Config.setFontSize("125" as any)).toBe(true);
    expect(Config.setFontSize("15" as any)).toBe(true);
    expect(Config.setFontSize("2" as any)).toBe(true);
    expect(Config.setFontSize("3" as any)).toBe(true);
    expect(Config.setFontSize("4" as any)).toBe(true);

    expect(Config.setFontSize(0)).toBe(false);
    expect(Config.setFontSize("5" as any)).toBe(false);
    expect(Config.setFontSize("invalid" as any)).toBe(false);
  });
  it("setMaxLineWidth", () => {
    expect(Config.setMaxLineWidth(0)).toBe(true);
    expect(Config.setMaxLineWidth(50)).toBe(true);
    expect(Config.setMaxLineWidth(50.5)).toBe(true);

    //gets converted
    expect(Config.setMaxLineWidth(10)).toBe(true);
    expect(Config.setMaxLineWidth(10_000)).toBe(true);
    expect(Config.setMaxLineWidth("invalid" as any)).toBe(false);
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
    expect(Config.setQuoteLength(0)).toBe(true);
    expect(Config.setQuoteLength(-3)).toBe(true);
    expect(Config.setQuoteLength(3)).toBe(true);

    expect(Config.setQuoteLength(-4 as any)).toBe(false);
    expect(Config.setQuoteLength(4 as any)).toBe(false);

    expect(Config.setQuoteLength([0, -3, 2])).toBe(true);

    expect(Config.setQuoteLength([-4 as any, 5 as any])).toBe(false);
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
